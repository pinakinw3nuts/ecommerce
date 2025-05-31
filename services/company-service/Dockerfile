FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Install tsconfig-paths for path aliases support in production
RUN npm install tsconfig-paths

# Copy tsconfig for path aliases
COPY tsconfig.json ./

# Expose port
EXPOSE 3010

# Set environment variables
ENV NODE_ENV=production

# Start the service
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"] 