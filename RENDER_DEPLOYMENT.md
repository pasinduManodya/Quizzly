# Render Deployment Guide

This guide contains all the information needed to deploy Quizzly on Render.

## Build Command

```bash
npm install && npm run build
```

This will:
1. Install all root dependencies
2. Change to client directory
3. Install client dependencies
4. Build the React application for production (from within client directory)

**Note**: The build script runs from within the `client` directory to ensure React Scripts can find `public/index.html` correctly.

## Start Command

```bash
npm start
```

This runs `node server.js` which:
- Connects to MongoDB
- Serves the built React app from `client/build`
- Starts the Express API server

## Environment Variables

Add these environment variables in your Render dashboard under **Environment**:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT token signing (use a long random string) | `your-super-secret-jwt-key-here-min-32-chars` |
| `GEMINI_API_KEY` | Google Gemini API key for AI quiz generation | `AIzaSy...` |

### Optional but Recommended Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (usually auto-set by Render) | `10000` |
| `FRONTEND_URL` | Your frontend URL for CORS (use your Render URL) | `https://your-app.onrender.com` |
| `REACT_APP_API_URL` | API base URL (should match your Render service URL) | `https://your-app.onrender.com` |

### Email Configuration (Optional)

If you want contact form emails to work:

| Variable | Description | Example |
|----------|-------------|---------|
| `GMAIL_USER` | Gmail address for sending emails | `your-email@gmail.com` |
| `GMAIL_PASS` | Gmail App Password (not your regular password) | `your-16-char-app-password` |

## Important Notes

1. **Build Time Variables**: `REACT_APP_API_URL` must be set **before** building. If you're using separate services for frontend/backend, adjust accordingly.

2. **Single Service Setup**: For a single service that serves both frontend and backend:
   - Set `REACT_APP_API_URL` to your Render service URL (e.g., `https://quizzly.onrender.com`)
   - The build will embed this URL into your React app

3. **MongoDB**: Make sure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or add Render's IP addresses.

4. **JWT_SECRET**: Generate a secure random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Port**: Render automatically sets the `PORT` environment variable, so you don't need to set it manually.

## Render Dashboard Configuration

1. **Service Type**: Web Service
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Root Directory**: Leave empty (or set to `.` if needed)
5. **Environment**: Node
6. **Node Version**: 18.x or 20.x (recommended)

## Deployment Steps

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select your repository
4. Configure:
   - **Name**: `quizzly` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add all environment variables listed above
6. Click "Create Web Service"
7. Wait for the first deployment to complete

## Troubleshooting

- **Build Fails**: Check that `REACT_APP_API_URL` is set before building
- **MongoDB Connection Issues**: Verify your MongoDB URI and network access settings
- **CORS Errors**: Set `FRONTEND_URL` to your Render service URL
- **API Not Found**: Ensure `REACT_APP_API_URL` matches your service URL

## Minimum Environment Variables Checklist

```
✅ MONGODB_URI
✅ JWT_SECRET  
✅ GEMINI_API_KEY
✅ NODE_ENV=production
✅ REACT_APP_API_URL=https://your-app.onrender.com
```

