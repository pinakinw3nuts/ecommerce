import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';
import Cookies from 'js-cookie';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const getClientAccessToken = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  
  // Check all possible token locations for maximum reliability
  return Cookies.get(ACCESS_TOKEN_NAME) || 
         Cookies.get(`${ACCESS_TOKEN_NAME}_client`) || 
         Cookies.get('auth_backup_token') ||
         localStorage.getItem(ACCESS_TOKEN_NAME) || 
         sessionStorage.getItem(ACCESS_TOKEN_NAME) || 
         null;
};

// Function to refresh the auth token
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    // Try to get refresh token from all possible sources
    const refreshToken = Cookies.get(REFRESH_TOKEN_NAME) || 
                        Cookies.get(`${REFRESH_TOKEN_NAME}_client`) || 
                        Cookies.get('auth_backup_refresh') ||
                        localStorage.getItem(REFRESH_TOKEN_NAME) || 
                        sessionStorage.getItem(REFRESH_TOKEN_NAME);
    
    if (!refreshToken) {
      console.log('No refresh token found');
      return false;
    }
    
    // Use next.js internal API to refresh token
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Ensure tokens are stored in multiple places for redundancy
      if (data.accessToken) {
        // Set in cookies
        Cookies.set(`${ACCESS_TOKEN_NAME}_client`, data.accessToken, { 
          expires: 1/48, // 30 minutes
          path: '/' 
        });
        
        // Set backup cookie with different name
        Cookies.set('auth_backup_token', data.accessToken, { 
          expires: 1/24, // 1 hour
          path: '/' 
        });
        
        // Also store in localStorage and sessionStorage
        localStorage.setItem(ACCESS_TOKEN_NAME, data.accessToken);
        sessionStorage.setItem(ACCESS_TOKEN_NAME, data.accessToken);
      }
      
      if (data.refreshToken) {
        // Set in cookies
        Cookies.set(`${REFRESH_TOKEN_NAME}_client`, data.refreshToken, { 
          expires: 7, // 7 days
          path: '/' 
        });
        
        // Set backup cookie with different name
        Cookies.set('auth_backup_refresh', data.refreshToken, { 
          expires: 7, // 7 days
          path: '/' 
        });
        
        // Also store in localStorage
        localStorage.setItem(REFRESH_TOKEN_NAME, data.refreshToken);
      }
      
      console.log('Token refreshed successfully');
      return true;
    }
    
    console.log('Failed to refresh token');
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Process the API response and handle common errors
const processResponse = async (response: Response, path: string): Promise<any> => {
  if (response.ok) {
    // For empty responses (204 No Content)
    if (response.status === 204) {
      return { success: true };
    }
    
    // Try to parse JSON, but fallback if it's not JSON
    try {
      return await response.json();
    } catch (e) {
      return { success: true };
    }
  }
  
  // Handle different error types
  if (response.status === 401 || response.status === 403) {
    // Before throwing, attempt to refresh token first
    const refreshSuccess = await refreshAuthToken();
    
    // If refresh was successful, throw a special error that will trigger a retry
    if (refreshSuccess) {
      throw new Error('token_refreshed');
    }
    
    // If refresh failed, throw auth error
    throw new Error('auth_error');
  }
  
  try {
    const errorData = await response.json();
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  } catch (e) {
    if (e instanceof Error && e.message === 'token_refreshed') {
      throw e; // Rethrow our special error
    }
    throw new Error(`Failed to process ${path} with status ${response.status}`);
  }
};

export const createApiClient = (baseURL: string) => {
  // Helper to make requests with potential token refresh
  const makeRequest = async (path: string, options?: RequestInit) => {
    let token = getClientAccessToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    };
    
    try {
      const response = await fetch(`${baseURL}${path}`, {
        ...options,
        credentials: 'include',
        headers: headers,
      });
      
      return await processResponse(response, path);
    } catch (error) {
      // If token refreshed error, retry the request with a new token
      if (error instanceof Error && error.message === 'token_refreshed') {
        // Get fresh token after refresh
        token = getClientAccessToken();
        
        if (!token) {
          console.error('No token available after refresh');
          throw new Error('auth_error');
        }
        
        // Retry with new token
        const newHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(options?.headers || {}),
        };
        
        const retryResponse = await fetch(`${baseURL}${path}`, {
          ...options,
          credentials: 'include',
          headers: newHeaders,
        });
        
        return await processResponse(retryResponse, path);
      }
      
      // If authentication error, try to refresh token and retry once
      if (error instanceof Error && error.message === 'auth_error') {
        const refreshSuccess = await refreshAuthToken();
        if (refreshSuccess) {
          // Get fresh token after refresh
          token = getClientAccessToken();
          
          if (!token) {
            console.error('No token available after refresh');
            throw new Error('auth_error');
          }
          
          // Retry with new token
          const newHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options?.headers || {}),
          };
          
          const retryResponse = await fetch(`${baseURL}${path}`, {
            ...options,
            credentials: 'include',
            headers: newHeaders,
          });
          
          return await processResponse(retryResponse, path);
        }
      }
      
      throw error;
    }
  };

  return {
    get: async <T>(path: string, options?: RequestInit): Promise<T> => {
      return makeRequest(path, { ...options, method: 'GET' });
    },

    post: async <T>(path: string, body: any, options?: RequestInit): Promise<T> => {
      return makeRequest(path, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    put: async <T>(path: string, body: any, options?: RequestInit): Promise<T> => {
      return makeRequest(path, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },

    delete: async <T>(path: string, options?: RequestInit): Promise<T> => {
      return makeRequest(path, { ...options, method: 'DELETE' });
    },

    patch: async <T>(path: string, body: any, options?: RequestInit): Promise<T> => {
      return makeRequest(path, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
  };
}; 