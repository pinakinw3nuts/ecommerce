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
    logger.debug({
      msg: 'Forwarding request to service',
      method,
      url,
      hasBody: !!body,
    });

    // Create a clean copy of headers, always omitting content-length to let undici calculate it
    const cleanHeaders = { ...headers };
    delete cleanHeaders['content-length'];
    
    // Convert body to string if it exists
    let bodyData: string | undefined;
    if (body) {
      bodyData = JSON.stringify(body);
      // Set the content-type if not already set
      if (!cleanHeaders['content-type']) {
        cleanHeaders['content-type'] = 'application/json';
      }
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
    const responseBody = await response.body.json().catch(async () => {
      try {
        return await response.body.text();
      } catch (e) {
        return undefined;
      }
    });

    logger.debug({
      msg: 'Service response received',
      method,
      url,
      status: response.statusCode,
      responseBodyType: typeof responseBody,
    });

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