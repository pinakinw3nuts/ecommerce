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

// Helper function to ensure dates are in proper ISO 8601 format or removed
export function prepareDateFields(data: any): void {
  // Helper function to format dates
  const formatDateToISO = (dateValue: string | Date | null | undefined): string | null => {
    if (!dateValue || dateValue === '') return null;
    
    try {
      // Handle various date formats
      const date = new Date(dateValue);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log(`Invalid date: ${dateValue}`);
        return null;
      }
      
      // Format as ISO 8601 string with Z suffix for UTC timezone
      return date.toISOString();
    } catch (error) {
      console.error(`Error formatting date ${dateValue}:`, error);
      return null;
    }
  };

  // Log original date values
  console.log('Original saleStartDate:', data.saleStartDate, typeof data.saleStartDate);
  console.log('Original saleEndDate:', data.saleEndDate, typeof data.saleEndDate);
  
  // Format dates
  const formattedStartDate = formatDateToISO(data.saleStartDate);
  const formattedEndDate = formatDateToISO(data.saleEndDate);
  
  console.log('Formatted saleStartDate:', formattedStartDate, typeof formattedStartDate);
  console.log('Formatted saleEndDate:', formattedEndDate, typeof formattedEndDate);
  
  // Remove date fields if they're null to avoid validation errors
  if (formattedStartDate === null) {
    delete data.saleStartDate;
  } else {
    data.saleStartDate = formattedStartDate;
  }
  
  if (formattedEndDate === null) {
    delete data.saleEndDate;
  } else {
    data.saleEndDate = formattedEndDate;
  }
} 