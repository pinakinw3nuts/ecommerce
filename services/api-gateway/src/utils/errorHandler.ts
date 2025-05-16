import { config } from '../config/env';

// Standard error response interface
export interface ErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  traceId?: string;
  requestId?: string;
  error?: unknown;
}

// Error codes mapping
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  SERVICE_ERROR: 'SERVICE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// HTTP status code mapping
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Maps HTTP status code to error code
 */
function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return ErrorCodes.BAD_REQUEST;
    case HTTP_STATUS.UNAUTHORIZED:
      return ErrorCodes.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return ErrorCodes.FORBIDDEN;
    case HTTP_STATUS.NOT_FOUND:
      return ErrorCodes.NOT_FOUND;
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
    case HTTP_STATUS.BAD_GATEWAY:
      return ErrorCodes.SERVICE_ERROR;
    default:
      return ErrorCodes.INTERNAL_ERROR;
  }
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(
  status: number,
  message: string,
  code?: string,
  details?: unknown,
  traceId?: string,
  requestId?: string,
  error?: unknown
): ErrorResponse {
  return {
    status,
    code: code || getErrorCodeFromStatus(status),
    message,
    details,
    timestamp: new Date().toISOString(),
    traceId,
    requestId,
    error,
  };
}

/**
 * Handles service errors and returns standardized error response
 * @param error The error to handle
 * @param traceId Optional trace ID for request tracking
 * @returns Standardized error response
 */
export function handleServiceError(error: unknown, requestId?: string): ErrorResponse {
  const timestamp = new Date().toISOString();

  // Handle known error types
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'ConnectTimeoutError') {
      return {
        status: 504,
        code: 'GATEWAY_TIMEOUT',
        message: 'Service connection timed out',
        timestamp,
        requestId,
      };
    }

    if (error.name === 'RequestAbortedError') {
      return {
        status: 499,
        code: 'CLIENT_CLOSED_REQUEST',
        message: 'Client closed request before completion',
        timestamp,
        requestId,
      };
    }

    // Service errors
    if (error.name === 'ServiceError') {
      return {
        status: 502,
        code: 'BAD_GATEWAY',
        message: 'Service returned an invalid response',
        timestamp,
        requestId,
        error: config.server.nodeEnv === 'development' ? error : undefined,
      };
    }
  }

  // Default to internal server error
  return {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    timestamp,
    requestId,
    error: config.server.nodeEnv === 'development' ? error : undefined,
  };
}

/**
 * Creates a validation error response
 */
export function createValidationError(
  message: string,
  details: unknown,
  traceId?: string
): ErrorResponse {
  return createErrorResponse(
    HTTP_STATUS.BAD_REQUEST,
    message,
    ErrorCodes.VALIDATION_ERROR,
    details,
    traceId
  );
}

/**
 * Creates a not found error response
 */
export function createNotFoundError(
  message: string,
  traceId?: string
): ErrorResponse {
  return createErrorResponse(
    HTTP_STATUS.NOT_FOUND,
    message,
    ErrorCodes.NOT_FOUND,
    undefined,
    traceId
  );
}

/**
 * Creates an unauthorized error response
 */
export function createUnauthorizedError(
  message: string,
  traceId?: string
): ErrorResponse {
  return createErrorResponse(
    HTTP_STATUS.UNAUTHORIZED,
    message,
    ErrorCodes.UNAUTHORIZED,
    undefined,
    traceId
  );
}

/**
 * Creates a too many requests error response
 */
export function createTooManyRequestsError(message: string, requestId?: string): ErrorResponse {
  return {
    status: 429,
    code: 'TOO_MANY_REQUESTS',
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Create a custom error for service unavailable
 */
export function createServiceUnavailableError(message: string, requestId?: string): ErrorResponse {
  return {
    status: 503,
    code: 'SERVICE_UNAVAILABLE',
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

// Example usage:
/*
try {
  await someServiceCall();
} catch (error) {
  const errorResponse = handleServiceError(error, requestId);
  return response
    .status(errorResponse.status)
    .json(errorResponse);
}
*/ 