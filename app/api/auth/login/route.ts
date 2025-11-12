/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 * Based on architecture.md authentication patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/services/auth.service';
import { loginSchema } from '@/lib/validations/auth';
import { createErrorResponse, UnauthorizedError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { auditAuthLogin, auditAuthLoginFailed } from '@/lib/middleware/audit.middleware';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (!user) {
      // Story 6.8: Audit failed login attempt
      await auditAuthLoginFailed(request, validatedData.email, 'User not found');
      // Don't reveal whether email exists or not (security best practice)
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      // Story 6.8: Audit failed login attempt
      await auditAuthLoginFailed(request, validatedData.email, 'Invalid password');
      throw new UnauthorizedError('Invalid email or password');
    }

    // Create JWT payload
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
    };

    // Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Story 6.8: Audit successful login
    await auditAuthLogin(request, user.id, user.firmId, user.email);

    // Remove password hash from user response
    const { passwordHash: _, ...userResponse } = user;

    return NextResponse.json(
      {
        accessToken,
        refreshToken,
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

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
