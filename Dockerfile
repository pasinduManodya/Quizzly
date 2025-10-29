# Multi-stage build for React + Node.js application

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy package files for frontend first (for better Docker layer caching)
COPY client/package.json client/package-lock.json ./

# Install ALL frontend dependencies (including devDependencies needed for build)
# npm ci installs exact versions from package-lock.json (recommended for Docker)
RUN npm ci

# Copy frontend source code and configuration files
COPY client/ ./

# Build the React app
RUN npm run build

# Verify build output exists
RUN test -d build || (echo "Build failed: build directory not found" && exit 1)

# Stage 2: Backend with built frontend
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY package.json package-lock.json ./

# Install backend dependencies (production only)
RUN npm ci --omit=dev

# Copy backend source code
COPY server.js ./
COPY config/ ./config/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY services/ ./services/
COPY utils/ ./utils/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/client/build ./client/build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]

