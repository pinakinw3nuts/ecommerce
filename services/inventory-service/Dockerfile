FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 3009

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "-r", "module-alias/register", "dist/server.js"] 