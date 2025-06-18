/**
 * API Configuration Helper
 * 
 * This script sets environment variables to control API behavior.
 * Run this with Node.js before starting the Next.js app.
 */

// Set to true to use real API data, false to use mock data
const USE_REAL_API_DATA = true;

if (USE_REAL_API_DATA) {
  // Disable mock data to use real API
  process.env.DISABLE_MOCK_DATA = 'true';
  process.env.USE_MOCK_DATA = 'false';
  console.log('Mock data disabled, using real API data');
} else {
  // Enable mock data (fallback)
  process.env.USE_MOCK_DATA = 'true';
  console.log('Mock data enabled, using fallback data');
}

// Define the API endpoints - explicitly using IPv4 addresses
process.env.NEXT_PUBLIC_ORDER_SERVICE_URL = 'http://127.0.0.1:3006/api/v1';
process.env.ORDER_SERVICE_URL = 'http://127.0.0.1:3006/api/v1';

console.log('API Configuration:');
console.log('- ORDER_SERVICE_URL:', process.env.ORDER_SERVICE_URL);
console.log('- NEXT_PUBLIC_ORDER_SERVICE_URL:', process.env.NEXT_PUBLIC_ORDER_SERVICE_URL);
console.log('- DISABLE_MOCK_DATA:', process.env.DISABLE_MOCK_DATA);
console.log('- USE_MOCK_DATA:', process.env.USE_MOCK_DATA);

console.log('\nStart your Next.js app with:');
console.log('node -r ./api-config.js node_modules/next/dist/bin/next dev'); 