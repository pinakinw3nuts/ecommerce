import { API_GATEWAY_URL } from './constants';

/**
 * Gets the API gateway URL with explicit IPv4 support for local development
 * @param endpoint The API endpoint path (without leading slash)
 * @returns The full URL to the API endpoint
 */
export function getApiUrl(endpoint: string): string {
  // Use explicit IPv4 address for local development
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:3000'
    : API_GATEWAY_URL.endsWith('/api')
      ? API_GATEWAY_URL.substring(0, API_GATEWAY_URL.length - 4)
      : API_GATEWAY_URL;
      
  // Ensure endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Log the request for debugging
  console.log('Making API request to:', `${baseUrl}${formattedEndpoint}`);
  
  return `${baseUrl}${formattedEndpoint}`;
}