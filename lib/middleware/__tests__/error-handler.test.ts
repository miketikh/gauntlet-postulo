/**
 * Error Handler Middleware Tests
 * Story 6.9 - Test error handling functionality
 */

import { describe, it, expect } from 'vitest';
import { handleApiError } from '../error-handler';
import {
  AppError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  RateLimitError,
  AIGenerationError,
} from '@/lib/errors';
import { z } from 'zod';

// Helper to parse NextResponse body
async function getResponseBody(response: any): Promise<any> {
  const text = await response.text();
  return JSON.parse(text);
}

describe('Error Handler Middleware', () => {
  it('should handle UnauthorizedError correctly', async () => {
    const error = new UnauthorizedError('Invalid token');
    const response = handleApiError(error);

    expect(response.status).toBe(401);
    const json = await getResponseBody(response);
    expect(json.error.code).toBe('UNAUTHORIZED');
    expect(json.error.message).toBe('You need to log in to access this resource.');
    expect(json.error.timestamp).toBeDefined();
  });

  it('should handle ValidationError correctly', async () => {
    const error = new ValidationError('Invalid input', { field: 'email' });
    const response = handleApiError(error);

    expect(response.status).toBe(400);
    const json = await getResponseBody(response);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toBe('Please check your input and try again.');
    expect(json.error.details).toEqual({ field: 'email' });
  });

  it('should handle NotFoundError correctly', async () => {
    const error = new NotFoundError('Project');
    const response = handleApiError(error);

    expect(response.status).toBe(404);
    const json = await getResponseBody(response);
    expect(json.error.code).toBe('NOT_FOUND');
    expect(json.error.message).toContain('project');
  });

  it('should handle ForbiddenError correctly', async () => {
    const error = new ForbiddenError('Insufficient permissions');
    const response = handleApiError(error);

    expect(response.status).toBe(403);
    const json = await getResponseBody(response);
    expect(json.error.code).toBe('FORBIDDEN');
    expect(json.error.message).toBe('You do not have permission to perform this action.');
  });

  it('should handle RateLimitError correctly', async () => {
    const error = new RateLimitError(60);
    const response = handleApiError(error);

    expect(response.status).toBe(429);
    const json = await getResponseBody(response);
    expect(json.error.code).toBe('RATE_LIMIT');
    expect(json.error.details?.retryAfter).toBe(60);
  });

  it('should handle AIGenerationError correctly', async () => {
    const error = new AIGenerationError('Token limit exceeded');
    const response = handleApiError(error);

    expect(response.status).toBe(500);
    const json = await getResponseBody(response);
    expect(json.error.code).toBe('AI_ERROR');
    expect(json.error.message).toContain('AI generation failed');
  });

  it('should handle ZodError correctly', async () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    try {
      schema.parse({ email: 'invalid', age: 15 });
      throw new Error('Should have thrown validation error');
    } catch (error) {
      const response = handleApiError(error);

      expect(response.status).toBe(400);
      const json = await getResponseBody(response);
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.message).toBe('Please check your input and try again.');
      expect(json.error.details).toBeDefined();
      expect(Array.isArray(json.error.details)).toBe(true);
    }
  });

  it('should handle generic Error correctly', async () => {
    const error = new Error('Something went wrong');
    const response = handleApiError(error);

    expect(response.status).toBe(500);
    const json = await getResponseBody(response);
    expect(json.error.code).toBe('INTERNAL_ERROR');
    expect(json.error.message).toBe('Something went wrong. Please try again later.');
    expect(json.error.timestamp).toBeDefined();
  });

  it('should handle unknown error types', async () => {
    const error = { unexpected: 'error object' };
    const response = handleApiError(error);

    expect(response.status).toBe(500);
    const json = await getResponseBody(response);
    expect(json.error.code).toBe('INTERNAL_ERROR');
    expect(json.error.message).toBe('An unexpected error occurred.');
  });

  it('should use user-friendly messages instead of technical ones', async () => {
    const error = new AppError(
      'CUSTOM_ERROR',
      'Technical error message',
      'User-friendly error message',
      500
    );

    const response = handleApiError(error);
    const json = await getResponseBody(response);

    expect(json.error.message).toBe('User-friendly error message');
    expect(json.error.message).not.toBe('Technical error message');
  });
});
