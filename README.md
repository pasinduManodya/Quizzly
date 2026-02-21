# Quizzly

AI-powered quiz generation platform.

## Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Configure `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quizzly
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
FRONTEND_URL=http://localhost:3000
```

3. Start:
```bash
npm run dev
```

## Commands

- `npm run dev` - Start both backend and frontend
- `npm run dev:backend` - Backend only (port 5000)
- `npm run dev:frontend` - Frontend only (port 3000)
- `npm start` - Production mode
- `npm run build` - Build frontend

## Structure

- `backend/` - Express API server
- `frontend/` - React application
