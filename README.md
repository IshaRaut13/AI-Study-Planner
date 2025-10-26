# AI Study Planner Pro 🚀

An intelligent study planning application that analyzes your syllabus, extracts topics with weightage analysis, and creates personalized study plans based on your exam timeline and study preferences.

## ✨ Features

### 🆕 Enhanced Features (v2.0)

- **📄 Syllabus Upload**: Support for text, PDF, Word documents, and images (OCR)
- **🧠 Topic Extraction**: AI-powered extraction of topics and subtopics from syllabus
- **📊 Weightage Analysis**: Automatic identification of topic importance and exam weightage
- **🔍 Online Research**: Integration with web search for exam syllabus and past papers
- **📅 Intelligent Scheduling**: Weightage-based time allocation with revision planning
- **💾 User Memory**: Persistent storage of user preferences, progress, and syllabus data
- **📈 Progress Tracking**: Track completion status and add notes for each study day
- **🎯 Structured Output**: Beautiful tables and organized study plans

### 🔄 Legacy Features

- **⚡ Quick Planning**: Simple subject-based study plan generation
- **📝 Basic Scheduling**: Day-wise study plan with time allocation
- **🎨 Modern UI**: Beautiful gradient interface with animations

## 🛠️ Technology Stack

### Backend

- **Node.js** with Express.js
- **Groq AI** for intelligent analysis and planning
- **Multer** for file uploads
- **Tesseract.js** for OCR (image text extraction)
- **PDF-parse** for PDF text extraction
- **Mammoth** for Word document processing
- **Cheerio** for web scraping
- **Axios** for HTTP requests

### Frontend

- **React 19** with Vite
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Groq API key

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-agent
```

### 2. Install Dependencies

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd client
npm install
```

### 3. Environment Setup

Create a `.env` file in the `server` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

### 4. Run the Application

#### Start Backend Server

```bash
cd server
npm run dev
# or
npm start
```

#### Start Frontend Development Server

```bash
cd client
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📖 Usage Guide

### Enhanced Mode (Recommended)

1. **Upload Syllabus**

   - Select your subject and exam type
   - Set your exam date and daily study hours
   - Upload your syllabus (text, PDF, Word, or image)

2. **Review Analysis**

   - View extracted topics with importance levels
   - Check weightage percentages and complexity ratings
   - Review online research results

3. **Generate Study Plan**

   - Click "Generate Study Plan" to create your personalized schedule
   - View day-wise breakdown with activities and time allocation

4. **Track Progress**
   - Mark completed days
   - Add notes and observations
   - Monitor your study progress

### Legacy Mode

1. **Enter Basic Information**

   - List your subjects
   - Set study days and hours per day

2. **Generate Plan**
   - Get a simple day-wise study plan
   - Includes revision and practice sessions

## 🔧 API Endpoints

### Enhanced API (v2.0)

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| `POST` | `/api/syllabus/upload`        | Upload and analyze syllabus     |
| `POST` | `/api/syllabus/generate-plan` | Generate intelligent study plan |
| `GET`  | `/api/syllabus/user/:userId`  | Get user data and progress      |
| `PUT`  | `/api/syllabus/progress`      | Update study progress           |
| `GET`  | `/api/syllabus/search`        | Search online for syllabus info |

### Legacy API

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| `POST` | `/generate-plan` | Generate basic study plan |

## 📁 Project Structure

```
ai-agent/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── App.css        # Styles
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   │   └── syllabusController.js
│   ├── routes/           # API routes
│   │   └── syllabusRoutes.js
│   ├── uploads/          # Temporary file storage
│   ├── index.js          # Main server file
│   └── package.json
└── README.md
```

## 🎯 Key Features Explained

### Syllabus Processing

- **Text Files**: Direct text extraction
- **PDF Files**: PDF parsing with metadata
- **Word Documents**: DOC/DOCX processing
- **Images**: OCR using Tesseract.js for text extraction

### AI Analysis

- **Topic Extraction**: Identifies main topics and subtopics
- **Weightage Analysis**: Determines importance and exam weightage
- **Complexity Assessment**: Rates difficulty levels
- **Time Estimation**: Suggests study hours per topic

### Intelligent Planning

- **Weightage-Based Allocation**: More time for important topics
- **Revision Scheduling**: Built-in revision and practice sessions
- **Progress Tracking**: Monitor completion and add notes
- **Adaptive Planning**: Considers user preferences and constraints

## 🔒 Data Storage

Currently uses in-memory storage for development. For production, consider:

- **MongoDB** for user data and progress
- **Redis** for session management
- **AWS S3** for file storage
- **PostgreSQL** for structured data

## 🚀 Deployment

### Backend Deployment

1. Set up environment variables
2. Install dependencies: `npm install`
3. Start server: `npm start`

### Frontend Deployment

1. Build for production: `npm run build`
2. Serve static files from `dist/` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:

1. Check the API documentation at `http://localhost:5000`
2. Review the console logs for error details
3. Ensure all dependencies are installed
4. Verify your Groq API key is valid

## 🔮 Future Enhancements

- [ ] Database integration for persistent storage
- [ ] User authentication and profiles
- [ ] Collaborative study planning
- [ ] Mobile app development
- [ ] Advanced analytics and insights
- [ ] Integration with calendar apps
- [ ] Study group features
- [ ] Performance optimization

---

**Made with ❤️ for students worldwide**
