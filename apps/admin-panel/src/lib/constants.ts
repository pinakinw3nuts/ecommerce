/**
 * Global constants used throughout the application
 */

// API base URL for all service requests
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Service-specific URLs
export const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002';
export const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3003';
export const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3004';

// Authentication constants
export const TOKEN_COOKIE_NAME = 'admin_token';
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date format options
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm'; 