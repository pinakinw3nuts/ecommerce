// API Gateway URL with multiple fallback options
export const API_GATEWAY_URL = 
  process.env.API_GATEWAY_URL || 
  (typeof window !== 'undefined' 
    ? '/api' // Client-side: Use relative URL
    : process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:3004/api/v1' // Server-side development (using correct cart service path)
      : 'http://api-gateway:3000/api/v1'); // Server-side in Docker/production

// Product API URL specifically for product service
export const PRODUCT_API_URL = process.env.PRODUCT_SERVICE_URL || 'http://127.0.0.1:3003/api/v1';

// Order API URL specifically for order service
export const ORDER_API_URL = process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:3005/api/v1';

// Flag to use mock data when API is not available
export const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || false;

// Token names for cookies
export const ACCESS_TOKEN_NAME = 'accessToken';
export const REFRESH_TOKEN_NAME = 'refreshToken';

// Default pagination values
export const DEFAULT_PAGE_SIZE = 12;
export const DEFAULT_PAGE = 1;

// Category display limits
export const FEATURED_CATEGORIES_LIMIT = 6;

// Product display limits
export const FEATURED_PRODUCTS_LIMIT = 8;
export const RELATED_PRODUCTS_LIMIT = 4;
export const NEW_ARRIVALS_LIMIT = 8;

// Search settings
export const MIN_SEARCH_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 300;

// Cart constants
export const MAX_CART_ITEMS = 99;

// Wishlist constants
export const MAX_WISHLIST_ITEMS = 100;

// Review constants
export const MIN_REVIEW_LENGTH = 10;
export const MAX_REVIEW_LENGTH = 1000;

// Order status labels
export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

// Form validation messages
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  password: 'Password must be at least 8 characters',
  passwordMatch: 'Passwords do not match',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be at most ${max} characters`,
}; 