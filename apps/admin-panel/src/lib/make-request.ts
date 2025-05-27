/**
 * Utility function for making HTTP requests with proper error handling
 * @param url The URL to make the request to
 * @param options Request options
 * @returns Response object
 */
export async function makeRequest(url: string, options: RequestInit = {}) {
  // Use IPv4 explicitly to avoid IPv6 issues
  const ipv4Url = url.replace('localhost', '127.0.0.1');
  console.log('Making request to:', ipv4Url);
  
  try {
    // Ensure URL is properly formatted
    const parsedUrl = new URL(ipv4Url);
    
    // Log the exact URL components being sent
    console.log('URL details:', {
      href: parsedUrl.href,
      origin: parsedUrl.origin,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      searchParams: Object.fromEntries(parsedUrl.searchParams.entries())
    });
    
    // Set default headers if not provided
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(parsedUrl.toString(), {
      ...options,
      headers,
      // Add a timeout to avoid hanging requests
      signal: options.signal || AbortSignal.timeout(30000), // 30 second timeout
    });
    
    console.log('Response status:', response.status);
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    // Add more detailed error information
    if (error instanceof TypeError && error.cause) {
      console.error('Network error details:', {
        code: (error.cause as any).code,
        syscall: (error.cause as any).syscall,
        address: (error.cause as any).address,
        port: (error.cause as any).port
      });
    }
    throw error;
  }
} 