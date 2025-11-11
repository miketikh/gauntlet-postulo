/**
 * POST /api/auth/register
 * Register a new user
 * Based on architecture.md authentication patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { users, firms } from '@/lib/db/schema';
import { hashPassword } from '@/lib/services/auth.service';
import { registerSchema } from '@/lib/validations/auth';
import { createErrorResponse, ConflictError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Verify firm exists
    const firm = await db.query.firms.findFirst({
      where: eq(firms.id, validatedData.firmId),
    });

    if (!firm) {
      throw new ConflictError('Invalid firm ID');
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role || 'paralegal',
        firmId: validatedData.firmId,
      })
      .returning();

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = newUser;

    return NextResponse.json(
      {
        user: userResponse,
        message: 'User registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

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

    // Handle known errors
    if (error instanceof ConflictError) {
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
