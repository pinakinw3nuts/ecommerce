import { request } from 'undici';
import { httpLogger as logger } from './logger';

// Define types for service requests and responses
export interface ServiceRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  timeout?: number;
}

export interface ServiceResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response?: ServiceResponse
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Forward a request to a microservice
 * @param serviceRequest Request configuration for the downstream service
 * @returns Promise with the service response
 * @throws ServiceError if the request fails or returns an error status
 */
export async function forwardRequest(serviceRequest: ServiceRequest): Promise<ServiceResponse> {
  const { method, url, headers = {}, body, timeout = 30000 } = serviceRequest;

  try {
    // Special detailed logging for user service requests
    const isUserServiceRequest = url.includes('user-service') || url.includes('3002');
    // Special logging for brand update requests
    const isBrandUpdateRequest = url.includes('/api/v1/admin/brands/') && method === 'PUT';
    
    if (isUserServiceRequest) {
      logger.info({
        msg: 'Forwarding request to user service',
        method,
        url,
        headers: Object.keys(headers),
        hasAuth: !!headers['authorization'],
        authPrefix: headers['authorization'] ? headers['authorization'].toString().substring(0, 15) + '...' : 'none',
        timeout,
      });
      
      // Special handling for PATCH requests to user service
      if (method === 'PATCH') {
        logger.info({
          msg: 'Special handling for user service PATCH request',
          url,
          bodyKeys: body ? Object.keys(body as object) : [],
        });
      }
    }

    // Special logging for brand update requests
    if (isBrandUpdateRequest) {
      logger.info({
        msg: 'BRAND UPDATE DEBUG',
        method,
        url,
        contentType: headers['content-type'],
        bodyType: body ? typeof body : 'none',
        bodyKeys: body && typeof body === 'object' ? Object.keys(body) : [],
        bodyString: body ? JSON.stringify(body).substring(0, 500) : 'none',
        bodyIsEmpty: !body || (typeof body === 'object' && Object.keys(body).length === 0)
      });
    }

    // Log the full URL and headers for debugging
    logger.debug({
      msg: 'Forwarding request to service',
      method,
      url,
      headers: Object.keys(headers),
      hasAuth: !!headers['authorization'],
      hasBody: !!body,
      bodyType: body ? typeof body : 'none',
      timeout,
    });

    // Create a clean copy of headers, removing problematic ones
    const cleanHeaders = { ...headers };
    delete cleanHeaders['content-length'];
    delete cleanHeaders['transfer-encoding'];
    delete cleanHeaders['expect']; // Remove expect header which causes issues with undici
    delete cleanHeaders['connection'];
    delete cleanHeaders['host'];
    
    // Convert body to string if it exists
    let bodyData: string | undefined;
    if (body) {
      bodyData = JSON.stringify(body);
      // Set the content-type if not already set
      if (!cleanHeaders['content-type']) {
        cleanHeaders['content-type'] = 'application/json';
      }
      
      // Log the body for debugging (truncated for large bodies)
      const bodyPreview = typeof bodyData === 'string' && bodyData.length > 100 
        ? bodyData.substring(0, 100) + '...' 
        : bodyData;
      logger.debug({
        msg: 'Request body preview',
        bodyPreview,
        contentType: cleanHeaders['content-type'],
      });
    }

    const response = await request(url, {
      method,
      headers: cleanHeaders as Record<string, string | string[]>,
      body: bodyData,
      bodyTimeout: timeout,
      headersTimeout: timeout,
      maxRedirections: 10,
    });

    // Try to parse the response body as JSON, but fall back to text or undefined
    let responseBody;
    try {
      responseBody = await response.body.json();
      logger.debug({
        msg: 'Response parsed as JSON',
        status: response.statusCode,
      });
    } catch (jsonError) {
      try {
        responseBody = await response.body.text();
        logger.debug({
          msg: 'Response parsed as text',
          status: response.statusCode,
          textLength: responseBody ? responseBody.length : 0,
        });
      } catch (textError) {
        responseBody = undefined;
        logger.debug({
          msg: 'Could not parse response body',
          status: response.statusCode,
        });
      }
    }

    // Special detailed logging for user service responses
    if (isUserServiceRequest) {
      logger.info({
        msg: 'User service response received',
        method,
        url,
        status: response.statusCode,
        responseHeaders: Object.keys(response.headers),
        responseBodySample: responseBody ? 
          (typeof responseBody === 'string' ? 
            (responseBody.length > 100 ? responseBody.substring(0, 100) + '...' : responseBody) 
            : JSON.stringify(responseBody).substring(0, 100) + '...') 
          : 'undefined',
      });
    }

    // Log detailed information for error responses
    if (response.statusCode >= 400) {
      logger.error({
        msg: 'Service returned error status',
        method,
        url,
        status: response.statusCode,
        responseHeaders: Object.keys(response.headers),
        responseBody: responseBody ? 
          (typeof responseBody === 'string' ? 
            (responseBody.length > 200 ? responseBody.substring(0, 200) + '...' : responseBody) 
            : JSON.stringify(responseBody).substring(0, 200) + '...') 
          : 'undefined',
      });
    } else {
      logger.debug({
        msg: 'Service response received',
        method,
        url,
        status: response.statusCode,
        responseBodyType: typeof responseBody,
      });
    }

    return {
      status: response.statusCode,
      headers: response.headers as Record<string, string | string[] | undefined>,
      body: responseBody,
    };
  } catch (error) {
    logger.error({
      err: error,
      msg: 'Service request failed',
      method,
      url,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Example usage:
/*
const response = await forwardRequest({
  method: 'POST',
  url: 'http://auth-service:3001/api/auth/login',
  headers: {
    'x-correlation-id': '123',
  },
  body: {
    username: 'user',
    password: 'pass',
  },
  timeout: 5000,
});
*/ 