# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install build dependencies for node-gyp and PostgreSQL client
RUN apk add --no-cache python3 make g++ postgresql-client

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Expose service port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server.js"] 