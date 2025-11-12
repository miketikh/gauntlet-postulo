/**
 * Error Handler Middleware
 * Story 6.9 - Centralized error handling for API routes
 *
 * Provides consistent error responses with user-friendly messages
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, createErrorResponse } from '@/lib/errors';

/**
 * Handle API errors and return standardized error responses
 * Usage in API routes:
 * ```typescript
 * try {
 *   // API logic
 * } catch (error) {
 *   return handleApiError(error);
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please check your input and try again.',
          details: error.issues?.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })) || [],
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  // Handle AppError and all custom error classes
  if (error instanceof AppError) {
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: error.statusCode });
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Log unexpected errors for debugging
    console.error('Unexpected error:', error);

    // Don't expose internal error details to client
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong. Please try again later.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  console.error('Unknown error type:', error);
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}

/**
 * Wrap an async API handler with error handling
 * Automatically catches errors and returns proper error responses
 *
 * Usage:
 * ```typescript
 * export const GET = withErrorHandler(async (req: NextRequest) => {
 *   const auth = await requireAuth(req);
 *   // ... API logic
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
