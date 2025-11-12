/**
 * Custom Error Classes for Steno Application
 * Based on architecture.md error handling standards
 * Story 6.9: Extended with user-friendly error messages
 */

/**
 * Base Application Error
 * All custom errors extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(
      'UNAUTHORIZED',
      message,
      'You need to log in to access this resource.',
      401
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(
      'VALIDATION_ERROR',
      message,
      'Please check your input and try again.',
      400,
      details
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(
      'NOT_FOUND',
      `${resource} not found`,
      `The ${resource.toLowerCase()} you're looking for doesn't exist.`,
      404
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(
      'FORBIDDEN',
      message,
      'You do not have permission to perform this action.',
      403
    );
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(
      'INTERNAL_ERROR',
      message,
      'Something went wrong. Please try again later.',
      500
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(
      'CONFLICT',
      message,
      'This resource already exists or conflicts with another resource.',
      409
    );
  }
}

/**
 * Story 6.9: Additional user-friendly error classes
 */

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'RATE_LIMIT',
      'Rate limit exceeded',
      'You\'ve made too many requests. Please wait a moment and try again.',
      429,
      retryAfter ? { retryAfter } : undefined
    );
  }
}

export class AIGenerationError extends AppError {
  constructor(message: string, cause?: string) {
    super(
      'AI_ERROR',
      message,
      'AI generation failed. Please try again or contact support if the problem persists.',
      500,
      cause ? { cause } : undefined
    );
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, details?: any) {
    super(
      'FILE_UPLOAD_ERROR',
      message,
      'File upload failed. Please check the file and try again.',
      400,
      details
    );
  }
}

export class FileTooLargeError extends AppError {
  constructor(maxSize: number) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    super(
      'FILE_TOO_LARGE',
      `File exceeds maximum size of ${maxSizeMB}MB`,
      `File is too large. Maximum size is ${maxSizeMB}MB.`,
      400,
      { maxSize }
    );
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(allowedTypes: string[]) {
    super(
      'INVALID_FILE_TYPE',
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      `Invalid file type. Please upload ${allowedTypes.join(', ')} files.`,
      400,
      { allowedTypes }
    );
  }
}

export class NetworkError extends AppError {
  constructor() {
    super(
      'NETWORK_ERROR',
      'Network request failed',
      'Connection error. Please check your internet and try again.',
      503
    );
  }
}

export class TimeoutError extends AppError {
  constructor() {
    super(
      'TIMEOUT',
      'Request timed out',
      'Request timed out. Please try again.',
      504
    );
  }
}

export class ExportError extends AppError {
  constructor(message: string) {
    super(
      'EXPORT_ERROR',
      message,
      'Export failed. Please try again or contact support.',
      500
    );
  }
}

/**
 * Standard error response format
 * Story 6.9: Uses userMessage for client-facing error messages
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string; // User-friendly message
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create standard error response
 * Story 6.9: Returns user-friendly messages instead of technical ones
 */
export function createErrorResponse(
  error: Error,
  requestId?: string
): ErrorResponse {
  const timestamp = new Date().toISOString();

  // Handle AppError and all its subclasses
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.userMessage, // User-friendly message
        details: error.details,
        timestamp,
        requestId,
      },
    };
  }

  // For unknown errors, don't expose internal details
  console.error('Unexpected error:', error);
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again later.',
      timestamp,
      requestId,
    },
  };
}
