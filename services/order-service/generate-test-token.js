/**
 * Test JWT Token Generator
 * 
 * This script generates a test JWT token for API testing.
 * Make sure the JWT_SECRET matches what's in your order-service .env file.
 */

const jwt = require('jsonwebtoken');

// Replace with the secret from your order-service .env file
const JWT_SECRET = 'your-super-secret-jwt-key-min-32-chars-here';

// Create a test user payload
const userPayload = {
  id: 'test-user-id',  // This will be used to retrieve orders
  email: 'test@example.com',
  roles: ['user'],     // Add 'admin' here if you want admin privileges
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
};

// Sign the JWT token
const token = jwt.sign(userPayload, JWT_SECRET);

console.log('\nTest JWT token generated! Use this in Postman or API requests:\n');
console.log(`Bearer ${token}\n`);
console.log('Include this in your Authorization header as shown above.\n');
console.log('Token will expire in 1 hour. To verify it, check:');
console.log('https://jwt.io/\n');
console.log('User ID in the token:', userPayload.id);
console.log('Roles in the token:', userPayload.roles.join(', '));
console.log('\nMake sure JWT_SECRET in this file matches your .env file setting!'); 