/**
 * Custom Error Classes for Steno Application
 * Based on architecture.md error handling standards
 */

export class UnauthorizedError extends Error {
  public readonly code = 'UNAUTHORIZED';
  public readonly statusCode = 401;

  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;
  public readonly details?: any;

  constructor(message: string = 'Validation failed', details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends Error {
  public readonly code = 'NOT_FOUND';
  public readonly statusCode = 404;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ForbiddenError extends Error {
  public readonly code = 'FORBIDDEN';
  public readonly statusCode = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InternalError extends Error {
  public readonly code = 'INTERNAL_ERROR';
  public readonly statusCode = 500;

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConflictError extends Error {
  public readonly code = 'CONFLICT';
  public readonly statusCode = 409;

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create standard error response
 */
export function createErrorResponse(
  error: Error,
  requestId?: string
): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof UnauthorizedError ||
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof ForbiddenError ||
      error instanceof ConflictError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: 'details' in error ? error.details : undefined,
        timestamp,
        requestId,
      },
    };
  }

  // For unknown errors, don't expose internal details
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp,
      requestId,
    },
  };
}
