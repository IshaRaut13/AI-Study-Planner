
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';
// import pdfParse from 'pdf-parse'; // Temporarily disabled due to dependency issues
import mammoth from 'mammoth';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// In-memory storage for user data (in production, use a database)
const userData = new Map();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadsDir);

// Extract text from different file types
const extractTextFromFile = async (filePath, fileType) => {
  try {
    switch (fileType) {
      case 'text/plain':
        return await fs.readFile(filePath, 'utf-8');
      
      case 'application/pdf':
        // For now, return a message that PDF processing is temporarily unavailable
        // In production, you would use a proper PDF parsing library
        return 'PDF processing is temporarily unavailable. Please convert your PDF to text format or use an image of the PDF.';
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docBuffer = await fs.readFile(filePath);
        const docResult = await mammoth.extractRawText({ buffer: docBuffer });
        return docResult.value;
      
      case 'image/jpeg':
      case 'image/png':
      case 'image/jpg':
        const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
        return text;
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
};

// Search online for exam syllabus and past papers
const searchOnlineSyllabus = async (subject, examType = '') => {
  try {
    const searchQuery = `${subject} syllabus ${examType} exam weightage topics`;
    const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    $('h3').each((i, element) => {
      const title = $(element).text();
      const link = $(element).parent().attr('href');
      if (title && link && !link.includes('google.com')) {
        results.push({ title, link });
      }
    });
    
    return results.slice(0, 5); // Return top 5 results
  } catch (error) {
    console.error('Error searching online:', error);
    return [];
  }
};

// Extract topics and analyze weightage using AI
const analyzeSyllabus = async (syllabusText, subject) => {
  try {
    const prompt = `
    Analyze the following syllabus for ${subject} and extract:
    
    1. All topics and subtopics clearly
    2. Importance level (High/Medium/Low) for each topic
    3. Estimated exam weightage percentage for each topic
    4. Complexity level (Beginner/Intermediate/Advanced)
    5. Suggested study time allocation
    
    Syllabus Text:
    ${syllabusText}
    
    Format your response as JSON with this structure:
    {
      "topics": [
        {
          "name": "Topic Name",
          "subtopics": ["Subtopic 1", "Subtopic 2"],
          "importance": "High/Medium/Low",
          "weightage": 25,
          "complexity": "Beginner/Intermediate/Advanced",
          "suggestedHours": 8
        }
      ],
      "totalTopics": 10,
      "estimatedTotalHours": 80
    }
    `;

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const analysis = completion.choices[0].message.content;
    return JSON.parse(analysis);
  } catch (error) {
    console.error('Error analyzing syllabus:', error);
    throw new Error('Failed to analyze syllabus');
  }
};

// Generate intelligent study plan
const generateStudyPlan = async (topics, days, hoursPerDay, userPreferences = {}) => {
  try {
    const totalHours = days * hoursPerDay;
    
    const prompt = `
    Create a detailed day-wise study plan based on the following information:
    
    Topics with weightage and complexity:
    ${JSON.stringify(topics, null, 2)}
    
    Available time:
    - Days: ${days}
    - Hours per day: ${hoursPerDay}
    - Total hours: ${totalHours}
    
    User preferences:
    ${JSON.stringify(userPreferences, null, 2)}
    
    Requirements:
    1. Allocate more time to high-weightage and complex topics
    2. Include revision sessions (20% of total time)
    3. Balance workload across days
    4. Include practice tests and mock exams
    5. Consider learning curve and topic dependencies
    
    Format as JSON:
    {
      "planTitle": "Study Plan for [Subject] - [Days] Days",
      "totalDays": ${days},
      "totalHours": ${totalHours},
      "days": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "focus": "Main focus area",
          "topics": ["Topic 1", "Topic 2"],
          "activities": [
            {
              "activity": "Study Topic 1",
              "duration": "2 hours",
              "type": "theory"
            },
            {
              "activity": "Practice problems",
              "duration": "1 hour",
              "type": "practice"
            }
          ],
          "totalTime": "3 hours",
          "difficulty": "Medium"
        }
      ],
      "revisionDays": [${Math.floor(days * 0.8)}, ${days}],
      "mockTestDays": [${Math.floor(days * 0.6)}, ${days - 1}]
    }
    `;

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    const plan = completion.choices[0].message.content;
    return JSON.parse(plan);
  } catch (error) {
    console.error('Error generating study plan:', error);
    throw new Error('Failed to generate study plan');
  }
};

export const uploadSyllabus = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { subject, examType, examDate, hoursPerDay } = req.body;
    const userId = req.body.userId || uuidv4();
    
    // Extract text from uploaded file
    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
    
    // Search online for additional information
    const onlineResults = await searchOnlineSyllabus(subject, examType);
    
    // Analyze syllabus using AI
    const analysis = await analyzeSyllabus(extractedText, subject);
    
    // Calculate days remaining
    const examDateObj = new Date(examDate);
    const today = new Date();
    const daysRemaining = Math.ceil((examDateObj - today) / (1000 * 60 * 60 * 24));
    
    // Store user data
    const userInfo = {
      userId,
      subject,
      examType,
      examDate,
      hoursPerDay: parseInt(hoursPerDay),
      daysRemaining,
      syllabusText: extractedText,
      analysis,
      onlineResults,
      uploadedAt: new Date().toISOString(),
      filePath: req.file.path
    };
    
    userData.set(userId, userInfo);
    
    // Clean up uploaded file
    await fs.remove(req.file.path);
    
    res.json({
      success: true,
      userId,
      analysis,
      onlineResults,
      daysRemaining,
      message: 'Syllabus uploaded and analyzed successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const generatePlan = async (req, res) => {
  try {
    const { userId, preferences = {} } = req.body;
    
    if (!userId || !userData.has(userId)) {
      return res.status(404).json({ error: 'User data not found. Please upload syllabus first.' });
    }
    
    const userInfo = userData.get(userId);
    const { analysis, daysRemaining, hoursPerDay } = userInfo;
    
    // Generate study plan
    const studyPlan = await generateStudyPlan(
      analysis.topics,
      daysRemaining,
      hoursPerDay,
      preferences
    );
    
    // Update user data with generated plan
    userInfo.studyPlan = studyPlan;
    userInfo.generatedAt = new Date().toISOString();
    userData.set(userId, userInfo);
    
    res.json({
      success: true,
      studyPlan,
      userInfo: {
        subject: userInfo.subject,
        examType: userInfo.examType,
        examDate: userInfo.examDate,
        daysRemaining: userInfo.daysRemaining
      }
    });
  } catch (error) {
    console.error('Plan generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userData.has(userId)) {
      return res.status(404).json({ error: 'User data not found' });
    }
    
    const userInfo = userData.get(userId);
    
    res.json({
      success: true,
      userInfo: {
        userId: userInfo.userId,
        subject: userInfo.subject,
        examType: userInfo.examType,
        examDate: userInfo.examDate,
        daysRemaining: userInfo.daysRemaining,
        hoursPerDay: userInfo.hoursPerDay,
        analysis: userInfo.analysis,
        studyPlan: userInfo.studyPlan,
        uploadedAt: userInfo.uploadedAt,
        generatedAt: userInfo.generatedAt
      }
    });
  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { userId, day, completed, notes } = req.body;
    
    if (!userData.has(userId)) {
      return res.status(404).json({ error: 'User data not found' });
    }
    
    const userInfo = userData.get(userId);
    
    if (!userInfo.progress) {
      userInfo.progress = {};
    }
    
    userInfo.progress[day] = {
      completed,
      notes,
      updatedAt: new Date().toISOString()
    };
    
    userData.set(userId, userInfo);
    
    res.json({
      success: true,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const searchOnline = async (req, res) => {
  try {
    const { subject, examType } = req.query;
    
    const results = await searchOnlineSyllabus(subject, examType);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
};
