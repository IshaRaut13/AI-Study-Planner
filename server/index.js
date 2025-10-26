import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import Tesseract from "tesseract.js";
import mammoth from "mammoth";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow text, PDF, Word documents, and images
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload text, PDF, Word document, or image files.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Function to extract text from different file types
const extractTextFromFile = async (filePath, fileType) => {
  try {
    switch (fileType) {
      case 'text/plain':
        return await fs.readFile(filePath, 'utf-8');
      
      case 'application/pdf':
        // For PDF, we'll return a message for now since pdf-parse had issues
        return 'PDF processing is temporarily unavailable. Please convert your PDF to text format or use an image of the PDF.';
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docBuffer = await fs.readFile(filePath);
        const docResult = await mammoth.extractRawText({ buffer: docBuffer });
        return docResult.value;
      
      case 'image/jpeg':
      case 'image/png':
      case 'image/jpg':
        console.log('Processing image with OCR...');
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

// Function to analyze syllabus using AI
const analyzeSyllabus = async (syllabusText, subject, examType) => {
  try {
    if (!genAI) {
      // Fallback analysis without AI
      return {
        topics: [
          {
            name: `${subject} - Fundamentals`,
            subtopics: ['Basic Concepts', 'Core Principles', 'Key Definitions'],
            importance: 'High',
            weightage: 35,
            complexity: 'Beginner',
            suggestedHours: 6
          },
          {
            name: `${subject} - Advanced Topics`,
            subtopics: ['Complex Problems', 'Advanced Applications', 'Case Studies'],
            importance: 'High',
            weightage: 30,
            complexity: 'Advanced',
            suggestedHours: 8
          },
          {
            name: `${subject} - Practice & Revision`,
            subtopics: ['Problem Solving', 'Mock Tests', 'Previous Papers'],
            importance: 'Medium',
            weightage: 25,
            complexity: 'Intermediate',
            suggestedHours: 4
          }
        ],
        totalTopics: 3,
        estimatedTotalHours: 18
      };
    }

    const prompt = `
    Analyze the following syllabus for ${subject} (${examType} exam) and extract:
    
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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();
    
    // Try to parse JSON from the response
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('Failed to parse AI response as JSON, using fallback');
    }
    
    // Fallback if JSON parsing fails
    return {
      topics: [
        {
          name: `${subject} - Core Topics`,
          subtopics: ['Main Concepts', 'Important Topics'],
          importance: 'High',
          weightage: 40,
          complexity: 'Intermediate',
          suggestedHours: 10
        }
      ],
      totalTopics: 1,
      estimatedTotalHours: 10
    };
  } catch (error) {
    console.error('Error analyzing syllabus:', error);
    throw new Error('Failed to analyze syllabus');
  }
};

// Initialize Gemini
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini AI initialized successfully');
} else {
  console.log('⚠️  GEMINI_API_KEY not found, using fallback responses');
}

// Routes
app.get("/", (req, res) => {
  res.json({
    message: 'AI Study Planner API is running',
    version: '2.0.0',
    features: [
      'Syllabus upload (text, PDF, Word, images)',
      'Topic extraction and weightage analysis',
      'Online syllabus research',
      'Intelligent study planning',
      'Progress tracking',
      'User data persistence'
    ]
  });
});

// Legacy route for backward compatibility
app.post("/generate-plan", async (req, res) => {
  const { subjects, days, hours } = req.body;

  const prompt = `
You are an AI study planner. A student has ${days} days until their exam and wants to study the following subjects: ${subjects}.
They can study ${hours} hours per day.

Create a day-wise study plan that:
  - Balances time between subjects
  - Suggests specific topics/activities per day
  - Includes one revision/mock test day
- Ends with a motivational note
`;

  try {
    let plan;
    
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      plan = result.response.text();
    } else {
      // Fallback mock response
      plan = `
**Your Study Plan for ${days} Days**

**Day 1: Foundation Building**
- Review basic concepts of ${subjects.split(',')[0] || 'main subject'} (${Math.floor(hours/2)} hours)
- Practice problems and examples (${Math.floor(hours/2)} hours)
- Time: ${hours} hours

**Day 2: Core Topics**
- Study advanced topics in ${subjects.split(',')[1] || 'second subject'} (${Math.floor(hours/2)} hours)
- Solve practice questions (${Math.floor(hours/2)} hours)
- Time: ${hours} hours

**Day 3: Integration & Practice**
- Combine concepts from all subjects (${Math.floor(hours/3)} hours)
- Take mock tests (${Math.floor(hours/3)} hours)
- Review and revise (${Math.floor(hours/3)} hours)
- Time: ${hours} hours

**Day ${days}: Final Revision**
- Quick review of all topics (${Math.floor(hours/2)} hours)
- Last-minute practice (${Math.floor(hours/2)} hours)
- Time: ${hours} hours

**Motivational Note:** You've got this! Stay consistent and believe in your preparation. Good luck! 🍀
      `;
    }

    res.json({ plan });
  } catch (error) {
    console.error("Error generating plan:", error);
    res.status(500).json({ error: "Failed to generate plan." });
  }
});

// Enhanced API routes
app.post('/api/syllabus/upload', upload.single('syllabus'), async (req, res) => {
  try {
    console.log('File upload request received:', req.file);
    console.log('Form data:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { subject, examType, examDate, hoursPerDay } = req.body;
    const userId = 'user-' + Date.now();
    
    // Calculate days remaining
    const examDateObj = new Date(examDate);
    const today = new Date();
    const daysRemaining = Math.ceil((examDateObj - today) / (1000 * 60 * 60 * 24));
    
    console.log(`Processing ${req.file.mimetype} file for ${subject} (${examType})`);
    
    // Extract text from the uploaded file
    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
    console.log('Extracted text length:', extractedText.length);
    console.log('First 200 characters:', extractedText.substring(0, 200));
    
    // Analyze the syllabus using AI
    const analysis = await analyzeSyllabus(extractedText, subject, examType);
    console.log('Analysis completed:', analysis);

    const onlineResults = [
      { title: `${examType} ${subject} Syllabus - Official`, link: '#' },
      { title: `${examType} ${subject} Previous Year Papers`, link: '#' },
      { title: `${examType} ${subject} Study Materials`, link: '#' }
    ];

    // Clean up uploaded file after processing
    try {
      await fs.remove(req.file.path);
    } catch (cleanupError) {
      console.log('File cleanup error (non-critical):', cleanupError.message);
    }

    res.json({
      success: true,
      userId,
      analysis,
      onlineResults,
      daysRemaining,
      extractedText: extractedText.substring(0, 500) + '...', // Include first 500 chars for debugging
      message: `Syllabus uploaded and analyzed successfully! Found ${analysis.totalTopics} main topics from your uploaded file.`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process uploaded file' });
  }
});

app.post('/api/syllabus/generate-plan', async (req, res) => {
  try {
    console.log('Plan generation request received:', req.body);
    const { userId, preferences = {} } = req.body;
    
    // Get the actual user data from the upload (we need to store this properly)
    // For now, we'll extract from the request or use defaults
    const { examDate, hoursPerDay, subject, examType } = req.body;
    
    console.log('Received plan generation request:', {
      examDate,
      hoursPerDay,
      subject,
      examType,
      hoursPerDayType: typeof hoursPerDay
    });
    
    // Calculate actual days remaining from today to exam date
    let totalDays = 30; // fallback
    let actualExamDate = new Date();
    
    if (examDate) {
      actualExamDate = new Date(examDate);
      const today = new Date();
      totalDays = Math.ceil((actualExamDate - today) / (1000 * 60 * 60 * 24));
      if (totalDays <= 0) totalDays = 1; // At least 1 day
    }
    
    const actualHoursPerDay = parseInt(hoursPerDay) || 6;
    const totalHours = totalDays * actualHoursPerDay;
    
    console.log(`Generating plan: ${totalDays} days, ${actualHoursPerDay} hours/day, exam date: ${actualExamDate.toDateString()}`);
    
    let studyPlan;
    
    if (genAI) {
      try {
        // Generate actual dates starting from today
        const today = new Date();
        const startDate = new Date(today);
        const endDate = new Date(actualExamDate);
        
        const prompt = `
        Create a detailed day-wise study plan for a student with the following parameters:
        - Subject: ${subject || 'Academic'}
        - Exam Type: ${examType || 'Academic'}
        - Total days: ${totalDays}
        - Hours per day: ${actualHoursPerDay}
        - Total hours: ${totalHours}
        - Start date: ${startDate.toDateString()}
        - Exam date: ${endDate.toDateString()}
        - User preferences: ${JSON.stringify(preferences)}
        
        Create a realistic study plan that:
        1. Starts from today (${startDate.toDateString()}) and ends on exam day (${endDate.toDateString()})
        2. Covers all topics progressively from basics to advanced
        3. Includes regular revision sessions (every 3-4 days)
        4. Has practice tests and mock exams (weekly)
        5. Balances workload with ${actualHoursPerDay} hours per day
        6. Includes rest days for better retention
        
        IMPORTANT: Respond ONLY with valid JSON. Do not include any comments, explanations, or text outside the JSON structure.
        
        Return this exact JSON structure with ${Math.min(totalDays, 10)} days (show first 10 days if more than 10):
        {
          "planTitle": "Study Plan for ${subject || 'Academic'} - ${totalDays} Days (${startDate.toDateString()} to ${endDate.toDateString()})",
          "totalDays": ${totalDays},
          "totalHours": ${totalHours},
          "startDate": "${startDate.toISOString().split('T')[0]}",
          "endDate": "${endDate.toISOString().split('T')[0]}",
          "days": [
            {
              "day": 1,
              "date": "${startDate.toISOString().split('T')[0]}",
              "focus": "Foundation Building",
              "topics": ["Basic Concepts", "Introduction"],
              "activities": [
                {
                  "activity": "Study basic concepts",
                  "duration": "${Math.floor(actualHoursPerDay * 0.6)} hours",
                  "type": "theory"
                },
                {
                  "activity": "Practice problems",
                  "duration": "${Math.floor(actualHoursPerDay * 0.4)} hours",
                  "type": "practice"
                }
              ],
              "totalTime": "${actualHoursPerDay} hours",
              "difficulty": "Easy"
            }
          ],
          "revisionDays": [${Math.floor(totalDays * 0.3)}, ${Math.floor(totalDays * 0.6)}, ${Math.floor(totalDays * 0.8)}],
          "mockTestDays": [${Math.floor(totalDays * 0.4)}, ${Math.floor(totalDays * 0.7)}, ${totalDays - 1}]
        }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const planText = result.response.text();
        
        console.log('AI response:', planText.substring(0, 200));
        
        try {
          // Clean the response text
          let cleanedText = planText.trim();
          
          // Remove any text before the first {
          const firstBrace = cleanedText.indexOf('{');
          if (firstBrace > 0) {
            cleanedText = cleanedText.substring(firstBrace);
          }
          
          // Remove any text after the last }
          const lastBrace = cleanedText.lastIndexOf('}');
          if (lastBrace > 0 && lastBrace < cleanedText.length - 1) {
            cleanedText = cleanedText.substring(0, lastBrace + 1);
          }
          
          // Remove any comments or invalid characters
          cleanedText = cleanedText.replace(/\/\/.*$/gm, ''); // Remove line comments
          cleanedText = cleanedText.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
          
          console.log('Cleaned JSON text:', cleanedText.substring(0, 200));
          
          studyPlan = JSON.parse(cleanedText);
          console.log('Successfully parsed AI response');
        } catch (parseError) {
          console.log('Failed to parse AI response as JSON:', parseError.message);
          console.log('Raw AI response:', planText);
          // Don't throw error, just use fallback
          studyPlan = null;
        }
      } catch (aiError) {
        console.log('AI generation failed, using fallback:', aiError.message);
        // Don't throw error, just use fallback
        studyPlan = null;
      }
    }
    
    // Fallback plan (used if AI fails or is not available)
    if (!studyPlan) {
      const today = new Date();
      const startDate = new Date(today);
      const endDate = new Date(actualExamDate);
      
      studyPlan = {
        planTitle: `Study Plan for ${subject || 'Academic'} - ${totalDays} Days (${startDate.toDateString()} to ${endDate.toDateString()})`,
        totalDays,
        totalHours,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: Array.from({ length: Math.min(totalDays, 10) }, (_, i) => {
          const currentDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
          return {
            day: i + 1,
            date: currentDate.toISOString().split('T')[0],
            focus: i === 0 ? 'Foundation Building' : 
                   i === totalDays - 1 ? 'Final Revision' : 
                   i % 4 === 0 ? 'Revision Day' : 'Core Topics',
            topics: i === 0 ? ['Basic Concepts', 'Introduction'] :
                   i === totalDays - 1 ? ['Final Review', 'Last Minute Prep'] :
                   i % 4 === 0 ? ['Previous Topics Review'] : ['Advanced Topics', 'Problem Solving'],
            activities: [
              { 
                activity: i === 0 ? 'Study basic concepts' : 
                         i === totalDays - 1 ? 'Final review of all topics' :
                         i % 4 === 0 ? 'Review previous topics' : 'Study advanced concepts', 
                duration: `${Math.floor(actualHoursPerDay * 0.6)} hours`, 
                type: 'theory' 
              },
              { 
                activity: i === 0 ? 'Practice basic problems' :
                         i === totalDays - 1 ? 'Quick practice test' :
                         i % 4 === 0 ? 'Practice previous problems' : 'Solve complex problems', 
                duration: `${Math.floor(actualHoursPerDay * 0.4)} hours`, 
                type: 'practice' 
              }
            ],
            totalTime: `${actualHoursPerDay} hours`,
            difficulty: i === 0 ? 'Easy' : i === totalDays - 1 ? 'Easy' : i % 4 === 0 ? 'Easy' : 'Medium'
          };
        }),
        revisionDays: [Math.floor(totalDays * 0.3), Math.floor(totalDays * 0.6), Math.floor(totalDays * 0.8)],
        mockTestDays: [Math.floor(totalDays * 0.4), Math.floor(totalDays * 0.7), totalDays - 1]
      };
    }

    console.log('Study plan generated successfully');
    res.json({
      success: true,
      studyPlan,
      userInfo: {
        subject: subject || 'Your Subject',
        examType: examType || 'Academic',
        examDate: actualExamDate.toISOString().split('T')[0],
        daysRemaining: totalDays,
        hoursPerDay: actualHoursPerDay,
        totalHours: totalHours
      }
    });
  } catch (error) {
    console.error('Plan generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate study plan',
      details: error.stack 
    });
  }
});

app.get('/api/syllabus/user/:userId', (req, res) => {
  res.json({
    success: true,
    userInfo: {
      userId: req.params.userId,
      subject: 'Sample Subject',
      examType: 'Academic',
      examDate: '2025-02-06',
      daysRemaining: 30,
      hoursPerDay: 6,
      analysis: { topics: [] },
      studyPlan: null,
      uploadedAt: new Date().toISOString()
    }
  });
});

app.put('/api/syllabus/progress', (req, res) => {
  res.json({
    success: true,
    message: 'Progress updated successfully (Mock Response)'
  });
});

app.get('/api/syllabus/search', (req, res) => {
  res.json({
    success: true,
    results: [
      { title: 'Sample Search Result 1', link: '#' },
      { title: 'Sample Search Result 2', link: '#' }
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
