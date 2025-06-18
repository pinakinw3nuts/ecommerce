/**
 * Order Service JWT Authentication Setup Script
 * 
 * This script helps set up JWT authentication for the order service.
 * It checks your .env file for JWT_SECRET, creates a sample .env if missing,
 * and generates a test token.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');

// Get the path to the .env file
const envPath = path.resolve(__dirname, '.env');
const envExamplePath = path.resolve(__dirname, '.env.example');

// Function to generate a secure random string for JWT_SECRET
function generateSecretKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Function to check if .env file exists and contains JWT_SECRET
function checkEnvFile() {
  console.log('📋 Checking environment configuration...');
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ No .env file found.');
    
    // Check if .env.example exists
    if (fs.existsSync(envExamplePath)) {
      console.log('✅ Found .env.example file.');
      console.log('📝 Creating .env file from example...');
      
      // Copy .env.example to .env
      let envContent = fs.readFileSync(envExamplePath, 'utf8');
      
      // Add or update JWT_SECRET
      const jwtSecret = generateSecretKey();
      if (envContent.includes('JWT_SECRET=')) {
        envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
      } else {
        envContent += `\n# JWT Authentication\nJWT_SECRET=${jwtSecret}\n`;
      }
      
      // Write the updated content to .env
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Created .env file with secure JWT_SECRET.');
    } else {
      console.log('❌ No .env.example found. Creating minimal .env file...');
      
      // Create a minimal .env file
      const minimalEnv = `# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/order_db

# Server Configuration
PORT=3006
NODE_ENV=development

# JWT Authentication
JWT_SECRET=${generateSecretKey()}

# CORS Configuration
CORS_ORIGINS=http://localhost:3100,http://localhost:3000

# Service URLs
CHECKOUT_SERVICE_URL=http://localhost:3005
PRODUCT_SERVICE_URL=http://localhost:3007
NOTIFICATION_SERVICE_URL=http://localhost:3008
`;
      
      // Write the minimal .env file
      fs.writeFileSync(envPath, minimalEnv);
      console.log('✅ Created minimal .env file with secure JWT_SECRET.');
    }
  } else {
    console.log('✅ Found existing .env file.');
    
    // Read the .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if JWT_SECRET is present
    if (!envContent.includes('JWT_SECRET=')) {
      console.log('❌ JWT_SECRET not found in .env file.');
      console.log('📝 Adding JWT_SECRET to .env file...');
      
      // Add JWT_SECRET
      const jwtSecret = generateSecretKey();
      envContent += `\n# JWT Authentication\nJWT_SECRET=${jwtSecret}\n`;
      
      // Write the updated content to .env
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Added secure JWT_SECRET to .env file.');
    } else {
      // Extract the JWT_SECRET value
      const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
      if (jwtSecretMatch && jwtSecretMatch[1]) {
        const jwtSecret = jwtSecretMatch[1].trim();
        
        // Check if JWT_SECRET is empty or too short
        if (!jwtSecret || jwtSecret.length < 32) {
          console.log('⚠️ JWT_SECRET is empty or too short. Updating with a secure key...');
          
          // Update JWT_SECRET
          const newJwtSecret = generateSecretKey();
          envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${newJwtSecret}`);
          
          // Write the updated content to .env
          fs.writeFileSync(envPath, envContent);
          console.log('✅ Updated JWT_SECRET with a secure key.');
        } else {
          console.log('✅ JWT_SECRET is properly configured.');
        }
      }
    }
  }
  
  // Re-read the .env file to get the current JWT_SECRET
  const envContent = fs.readFileSync(envPath, 'utf8');
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  if (jwtSecretMatch && jwtSecretMatch[1]) {
    return jwtSecretMatch[1].trim();
  }
  
  return null;
}

// Function to generate a test token
function generateTestToken(jwtSecret) {
  console.log('\n📋 Generating test JWT token...');
  
  // Create a test user payload
  const userPayload = {
    id: 'test-user-id',
    email: 'test@example.com',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };
  
  // Sign the JWT token
  const token = jwt.sign(userPayload, jwtSecret);
  
  console.log('✅ Test token generated successfully!');
  console.log('\n📋 Token details:');
  console.log('User ID:', userPayload.id);
  console.log('Expiration:', new Date(userPayload.exp * 1000).toLocaleString());
  
  return token;
}

// Function to check dependencies
function checkDependencies() {
  console.log('\n📋 Checking required dependencies...');
  
  try {
    // Check if jsonwebtoken is installed
    require.resolve('jsonwebtoken');
    console.log('✅ jsonwebtoken package is installed.');
  } catch (error) {
    console.log('❌ jsonwebtoken package is not installed.');
    console.log('📝 Installing jsonwebtoken...');
    
    try {
      execSync('npm install jsonwebtoken', { stdio: 'inherit' });
      console.log('✅ jsonwebtoken installed successfully.');
    } catch (error) {
      console.error('❌ Failed to install jsonwebtoken:', error.message);
      console.log('Please install manually: npm install jsonwebtoken');
    }
  }
}

// Main function
async function main() {
  console.log('\n=== Order Service JWT Authentication Setup ===\n');
  
  // Check dependencies
  checkDependencies();
  
  // Check and configure .env file
  const jwtSecret = checkEnvFile();
  
  if (!jwtSecret) {
    console.error('❌ Failed to configure JWT_SECRET. Please check your .env file.');
    process.exit(1);
  }
  
  // Generate a test token
  const token = generateTestToken(jwtSecret);
  
  console.log('\n=== Authorization Header for API Requests ===\n');
  console.log(`Authorization: Bearer ${token}`);
  
  console.log('\n=== Test Commands ===\n');
  console.log('1. Debug JWT token:');
  console.log(`   node debug-jwt.js "Bearer ${token}"`);
  console.log('\n2. Test API with curl:');
  console.log(`   curl -H "Authorization: Bearer ${token}" http://localhost:3006/api/v1/public/orders`);
  console.log('\n3. Create a test order:');
  console.log('   node create-test-order.js test-user-id');
  
  console.log('\n=== Setup Complete! ===\n');
}

main().catch(console.error); 