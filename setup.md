# Setup Instructions

## Quick Start

1. **Install Dependencies**

   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the `server` directory:

   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=5000
   ```

3. **Get Groq API Key**

   - Visit [Groq Console](https://console.groq.com/)
   - Sign up/Login
   - Create a new API key
   - Copy the key to your `.env` file

4. **Run the Application**

   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Features Available

### Enhanced Mode

- Upload syllabus (text, PDF, Word, images)
- AI-powered topic extraction
- Weightage analysis
- Online research integration
- Intelligent study planning
- Progress tracking

### Legacy Mode

- Simple subject-based planning
- Quick study plan generation

## Troubleshooting

1. **Port already in use**: Change PORT in `.env` file
2. **API key issues**: Verify your Groq API key is valid
3. **File upload errors**: Check file size (max 10MB) and format
4. **CORS errors**: Ensure backend is running on correct port

## Support

Check the main README.md for detailed documentation and API reference.
