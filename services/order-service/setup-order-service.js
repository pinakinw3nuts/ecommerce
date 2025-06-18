/**
 * Order Service Setup Script
 * This script creates the necessary .env file and ensures API routes are working
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define environment file path
const envFilePath = path.join(__dirname, '.env');

// Define environment variables content
const envContent = `# Server configuration
PORT=3006
NODE_ENV=development

# Database configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/order_db

# JWT configuration (for authentication)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-here

# CORS origins
CORS_ORIGINS=http://localhost:3100,http://localhost:3000,http://localhost:3001

# Service URLs for inter-service communication
CHECKOUT_SERVICE_URL=http://localhost:3005/api/v1
PRODUCT_SERVICE_URL=http://localhost:3003/api/v1
NOTIFICATION_SERVICE_URL=http://localhost:3007/api/v1
`;

// Write environment file
console.log('Creating .env file...');
fs.writeFileSync(envFilePath, envContent);
console.log('✅ .env file created successfully!');

// Check if we have the routes file
const orderRoutesPath = path.join(__dirname, 'src', 'routes', 'order.routes.ts');

if (fs.existsSync(orderRoutesPath)) {
  console.log('✅ Order routes file exists');
  
  // Simple check if we have the GET orders endpoint
  const orderRoutes = fs.readFileSync(orderRoutesPath, 'utf8');
  
  if (!orderRoutes.includes('get(')) {
    console.warn('⚠️ GET route may not be properly implemented in order routes');
  } else {
    console.log('✅ Orders GET route appears to be implemented');
  }
} else {
  console.error('❌ Order routes file not found!');
}

// Check server file to ensure it's using port 3006
const serverFilePath = path.join(__dirname, 'src', 'server.ts');
if (fs.existsSync(serverFilePath)) {
  let serverContent = fs.readFileSync(serverFilePath, 'utf8');
  if (serverContent.includes('config.port || process.env.PORT || 3006')) {
    console.log('✅ Server configured to use port 3006');
  } else {
    console.warn('⚠️ Server may not be using port 3006 by default');
  }
} else {
  console.error('❌ Server file not found!');
}

console.log('\n📋 Setup Complete! Next steps:');
console.log('1. Start the order service with: cd services/order-service && npm run start:dev');
console.log('2. Verify API is working with: curl http://localhost:3006/health');
console.log('3. Check Swagger docs at: http://localhost:3006/documentation\n'); 