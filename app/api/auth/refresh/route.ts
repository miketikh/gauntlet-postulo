/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Based on architecture.md authentication patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  verifyRefreshToken,
  generateAccessToken,
} from '@/lib/services/auth.service';
import { refreshTokenSchema } from '@/lib/validations/auth';
import { createErrorResponse, UnauthorizedError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = refreshTokenSchema.parse(body);

    // Verify refresh token
    const payload = verifyRefreshToken(validatedData.refreshToken);

    // Generate new access token with same payload
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      firmId: payload.firmId,
    });

    return NextResponse.json(
      {
        accessToken: newAccessToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.issues,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Handle unauthorized errors
    if (error instanceof UnauthorizedError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    // Handle unexpected errors (don't expose internal details)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
