/**
 * JWT Verification Debugger
 * 
 * This script helps debug JWT token verification issues.
 * It simulates the JWT verification process used in the order service.
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Get JWT secret from .env or use default
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars-here';

// Function to verify a token
function verifyToken(token) {
  try {
    // Remove 'Bearer ' if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    
    console.log('Verifying token...');
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('✅ Token is valid!');
    console.log('\nDecoded token payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Check for required fields
    if (!decoded.id) {
      console.warn('⚠️ Warning: Token doesn\'t contain an "id" field, which is required for user identification');
    } else {
      console.log('✅ User ID present in token:', decoded.id);
    }
    
    // Check expiration
    if (decoded.exp) {
      const expiryDate = new Date(decoded.exp * 1000);
      const now = new Date();
      if (expiryDate > now) {
        const timeLeft = Math.floor((expiryDate - now) / 1000 / 60); // minutes
        console.log(`✅ Token is not expired. Expires in ${timeLeft} minutes.`);
      } else {
        console.error('❌ Token is expired! Expired on:', expiryDate);
      }
    } else {
      console.warn('⚠️ Warning: Token doesn\'t have an expiration (exp) field');
    }
    
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    
    if (error.name === 'JsonWebTokenError' && error.message === 'invalid signature') {
      console.error('\nInvalid signature error likely means:');
      console.error('1. The JWT_SECRET used to sign the token doesn\'t match the one in your .env file');
      console.error('2. Current JWT_SECRET being used:', JWT_SECRET);
      console.error('3. Make sure this matches the secret used to sign the token');
    }
    
    if (error.name === 'TokenExpiredError') {
      console.error('\nToken is expired. Generate a new token with:');
      console.error('node generate-test-token.js');
    }
    
    return null;
  }
}

// Main function
async function main() {
  console.log('\nJWT Verification Debugger\n');
  
  // Get token from command line argument
  let token = process.argv[2];
  
  // If no token provided, prompt for one
  if (!token) {
    console.log('No token provided. Please enter a JWT token to verify:');
    console.log('Usage: node debug-jwt.js "Bearer eyJhbGciOiJIUzI1..."');
    process.exit(1);
  }
  
  console.log('JWT Secret being used:', JWT_SECRET);
  console.log('If this doesn\'t match the secret used to create the token, verification will fail.\n');
  
  // Verify the token
  const decoded = verifyToken(token);
  
  if (decoded) {
    // Test with this token in the order service
    console.log('\n📋 Next steps:');
    console.log('1. Use this token in Postman');
    console.log('2. Send request to: GET http://localhost:3006/api/v1/public/orders');
    console.log('3. Add header: Authorization: Bearer ' + (token.startsWith('Bearer ') ? token : `Bearer ${token}`));
  } else {
    console.log('\n❌ Token verification failed. Please check the error messages above.');
  }
}

main().catch(console.error); 