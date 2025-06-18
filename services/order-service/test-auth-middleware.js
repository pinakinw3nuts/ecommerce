/**
 * Test script for Order Service authentication
 * 
 * This script tests the authentication flow with different JWT token scenarios
 */

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

// Get JWT secret from .env or use default
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars-here';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3006';

/**
 * Generate test tokens with different configurations
 */
function generateTokens() {
  // Generate a valid user token
  const validUserToken = jwt.sign(
    { 
      id: 'test-user-id',
      email: 'test@example.com' 
    }, 
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Generate an admin token
  const adminToken = jwt.sign(
    { 
      id: 'admin-user-id',
      email: 'admin@example.com',
      roles: ['admin'] 
    }, 
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Generate an invalid token (wrong secret)
  const invalidToken = jwt.sign(
    { 
      id: 'test-user-id',
      email: 'test@example.com' 
    }, 
    'wrong-secret',
    { expiresIn: '1h' }
  );
  
  // Generate an expired token
  const expiredToken = jwt.sign(
    { 
      id: 'test-user-id',
      email: 'test@example.com' 
    }, 
    JWT_SECRET,
    { expiresIn: '0s' }
  );
  
  return {
    validUserToken,
    adminToken,
    invalidToken,
    expiredToken
  };
}

/**
 * Test authentication against different endpoints
 */
async function testAuthentication() {
  const tokens = generateTokens();
  const endpoints = {
    publicEndpoint: `${ORDER_SERVICE_URL}/api/v1/public/orders`,
    protectedEndpoint: `${ORDER_SERVICE_URL}/api/v1/orders`,
    adminEndpoint: `${ORDER_SERVICE_URL}/api/v1/admin/orders`
  };
  
  console.log('\n=== Order Service Authentication Test ===\n');
  console.log(`Service URL: ${ORDER_SERVICE_URL}`);
  console.log(`JWT Secret: ${JWT_SECRET.substring(0, 3)}...${JWT_SECRET.substring(JWT_SECRET.length - 3)}`);
  
  // Test health endpoint (no auth required)
  try {
    console.log('\n--- Testing Health Endpoint (No Auth) ---');
    const healthResponse = await fetch(`${ORDER_SERVICE_URL}/health`);
    console.log(`Status: ${healthResponse.status}`);
    console.log('Response:', await healthResponse.json());
  } catch (error) {
    console.error('Health check failed:', error.message);
    console.log('Make sure the Order Service is running.');
    process.exit(1);
  }
  
  // Test 1: Public endpoint with no token
  console.log('\n--- Test 1: Public Endpoint (No Token) ---');
  try {
    const response = await fetch(endpoints.publicEndpoint);
    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ SUCCESS: Public endpoint accessible without token');
    } else {
      console.log('❌ FAIL: Public endpoint should be accessible without token');
      const data = await response.text();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  // Test 2: Protected endpoint with valid user token
  console.log('\n--- Test 2: Protected Endpoint (Valid User Token) ---');
  try {
    const response = await fetch(endpoints.protectedEndpoint, {
      headers: {
        'Authorization': `Bearer ${tokens.validUserToken}`
      }
    });
    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ SUCCESS: Protected endpoint accessible with valid token');
    } else {
      console.log('❌ FAIL: Protected endpoint should be accessible with valid token');
      const data = await response.text();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  // Test 3: Protected endpoint with invalid token
  console.log('\n--- Test 3: Protected Endpoint (Invalid Token) ---');
  try {
    const response = await fetch(endpoints.protectedEndpoint, {
      headers: {
        'Authorization': `Bearer ${tokens.invalidToken}`
      }
    });
    console.log(`Status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ SUCCESS: Invalid token rejected correctly');
    } else {
      console.log('❌ FAIL: Invalid token should be rejected');
      const data = await response.text();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  // Test 4: Admin endpoint with user token
  console.log('\n--- Test 4: Admin Endpoint (Regular User Token) ---');
  try {
    const response = await fetch(endpoints.adminEndpoint, {
      headers: {
        'Authorization': `Bearer ${tokens.validUserToken}`
      }
    });
    console.log(`Status: ${response.status}`);
    if (response.status === 403) {
      console.log('✅ SUCCESS: Regular user correctly denied access to admin endpoint');
    } else {
      console.log('❌ FAIL: Regular user should be denied access to admin endpoint');
      const data = await response.text();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  // Test 5: Admin endpoint with admin token
  console.log('\n--- Test 5: Admin Endpoint (Admin Token) ---');
  try {
    const response = await fetch(endpoints.adminEndpoint, {
      headers: {
        'Authorization': `Bearer ${tokens.adminToken}`
      }
    });
    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ SUCCESS: Admin user granted access to admin endpoint');
    } else {
      console.log('❌ FAIL: Admin user should have access to admin endpoint');
      const data = await response.text();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  // Test 6: Protected endpoint with expired token
  console.log('\n--- Test 6: Protected Endpoint (Expired Token) ---');
  try {
    const response = await fetch(endpoints.protectedEndpoint, {
      headers: {
        'Authorization': `Bearer ${tokens.expiredToken}`
      }
    });
    console.log(`Status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ SUCCESS: Expired token correctly rejected');
    } else {
      console.log('❌ FAIL: Expired token should be rejected');
      const data = await response.text();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  console.log('\n=== Authentication Test Summary ===');
  console.log('Valid user token:');
  console.log(tokens.validUserToken);
  console.log('\nAdmin token:');
  console.log(tokens.adminToken);
  
  console.log('\nThese tokens can be used in Postman or any API client to test the endpoints');
}

// Run the tests
testAuthentication().catch(console.error); 