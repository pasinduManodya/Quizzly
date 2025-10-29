# Quizzly

A web application that helps students study by uploading PDFs and generating AI-powered quizzes.

## Features

- User authentication (login/signup)
- PDF upload and text extraction
- AI-generated multiple choice and short answer questions
- Interactive quiz system
- Results tracking and revision history
- Responsive design with TailwindCSS

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB
- **AI**: OpenAI GPT-4-Turbo
- **Frontend**: React
- **Styling**: TailwindCSS

## 🚀 Quick Start (One Command Deployment)

### Option 1: Using npm (Recommended)
```bash
npm run dev
```
This will automatically:
- Install all dependencies
- Start both backend and frontend servers
- Handle port conflicts
- Show real-time logs

### Option 2: Using Deployment Scripts

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**PowerShell:**
```powershell
.\deploy.ps1
```

### Option 3: Manual Setup
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

## Project Structure

```
├── server.js              # Main server file
├── models/               # Database models
├── routes/               # API routes
├── middleware/           # Custom middleware
├── uploads/              # PDF storage directory
└── client/               # React frontend
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── services/    # API services
    │   └── utils/        # Utility functions
    └── public/
```
