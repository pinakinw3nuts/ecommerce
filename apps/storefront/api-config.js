/**
 * API Configuration Helper
 * 
 * This script sets environment variables to control API behavior.
 * Run this with Node.js before starting the Next.js app.
 */

// This is a configuration file for API endpoints used in the storefront
// It gets loaded before starting the Next.js app

// Set environment variables based on runtime configuration
process.env.ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3006';
process.env.NEXT_PUBLIC_ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3006';

// API configuration for disabling/enabling mock data
const DISABLE_MOCK_DATA = process.env.DISABLE_MOCK_DATA === 'true';
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Set default behavior for using mock data
if (DISABLE_MOCK_DATA) {
  process.env.USE_MOCK_DATA = 'false';
} else if (USE_MOCK_DATA) {
  process.env.USE_MOCK_DATA = 'true';
} else {
  // Default behavior: use mock data in development, real data in production
  process.env.USE_MOCK_DATA = process.env.NODE_ENV === 'development' ? 'true' : 'false';
}

// Apply the configuration
process.env.NEXT_PUBLIC_USE_MOCK_DATA = process.env.USE_MOCK_DATA; 