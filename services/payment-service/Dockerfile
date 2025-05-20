# Use Node.js 18 Alpine as the base image
FROM node:18-alpine

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json for installing dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the entire project
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3006

# Set Node.js to run in production mode
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "dist/index.js"] 