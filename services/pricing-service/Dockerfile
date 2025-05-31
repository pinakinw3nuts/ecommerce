FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the service port
EXPOSE 3011

# Set environment variables
ENV NODE_ENV=production

# Use non-root user for security
USER node

# Start the service
CMD ["node", "-r", "module-alias/register", "dist/server.js"] 