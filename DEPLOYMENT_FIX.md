# Deployment Build Fix Guide

## Issue
`react-scripts: not found` error when running `npm run build` during deployment.

## Root Cause
Dependencies in the `client` directory are not installed before the build process runs.

## Solutions

### Solution 1: Use Updated Build Script (Recommended)
The build script has been updated to automatically install dependencies:

```bash
npm run build
```

This will now:
1. Navigate to the `client` directory
2. Install dependencies (`npm install`)
3. Build the React app (`npm run build`)

### Solution 2: Manual Dependency Installation
If you need more control, install dependencies manually first:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Then build
npm run build
```

Or use the helper script:

```bash
npm run install:all
npm run build
```

### Solution 3: For CI/CD Pipelines
Use the CI-optimized build script:

```bash
npm run build:ci
```

This uses `npm ci` instead of `npm install` for faster, more reliable builds in CI environments.

### Solution 4: Docker Deployment
If you're using Docker, a proper `Dockerfile` has been created that handles the build process correctly.

Build the Docker image:
```bash
docker build -t quizzly-app .
```

Run the container:
```bash
docker run -p 5000:5000 --env-file .env quizzly-app
```

## Platform-Specific Instructions

### Railway / Render / Fly.io / Similar Platforms
These platforms should automatically detect the `Dockerfile` and use it. If not:

1. **Build Command**: `npm run install:all && npm run build`
2. **Start Command**: `node server.js`
3. **Root Directory**: `/` (root of the repository)

Ensure your platform configuration includes:
- Node.js version 18 or higher
- Build command that installs both root and client dependencies

### Heroku
Add this to your `package.json` scripts section (already included):
```json
"heroku-postbuild": "cd client && npm install && npm run build"
```

### Vercel / Netlify
These platforms typically build the frontend separately. You may need to:
1. Deploy backend separately (as a serverless function or separate service)
2. Deploy frontend separately pointing to your backend API

### Platform.sh / Other
Ensure your build configuration runs:
```bash
npm install
cd client && npm install && npm run build
cd ..
```

## Verification

After building, verify the build output exists:
```bash
# Check if build directory was created
ls client/build
```

You should see:
- `static/` directory (with JS/CSS files)
- `index.html`
- `asset-manifest.json`
- Other static assets

## Common Issues

### Issue: Still getting "react-scripts: not found"
**Fix**: Ensure `node_modules` exists in the `client` directory:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
cd ..
npm run build
```

### Issue: Build fails in Docker
**Fix**: Ensure the Dockerfile uses the correct Node version and installs dependencies:
```dockerfile
FROM node:18-alpine
```

### Issue: Platform doesn't detect dependencies
**Fix**: Make sure `package-lock.json` files are committed to your repository:
```bash
git add package-lock.json client/package-lock.json
git commit -m "Add package lock files"
```

## Quick Test Locally

Test the build process locally before deploying:

```bash
# Clean install (optional but recommended)
rm -rf node_modules client/node_modules

# Install all dependencies
npm run install:all

# Build for production
npm run build

# Start production server (to test)
npm start
```

Visit `http://localhost:5000` to verify the built app works correctly.

