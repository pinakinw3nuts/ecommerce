FROM node:18-alpine as builder

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Add configuration files
COPY .env* ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3014

# Expose the port the app runs on
EXPOSE 3014

# Start the application
CMD ["node", "dist/server.js"] 