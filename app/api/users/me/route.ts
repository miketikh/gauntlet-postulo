/**
 * User Profile API Routes
 * GET /api/users/me - Get current user profile
 * PATCH /api/users/me - Update current user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/middleware/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

/**
 * GET /api/users/me
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        firmId: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
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

/**
 * PATCH /api/users/me
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // If email is being changed, check for conflicts
    if (data.email) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });

      // Check if email is taken by another user
      if (existingUser && existingUser.id !== auth.userId) {
        return NextResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: 'Email already in use',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 }
        );
      }
    }

    // Update user profile
    const updatedUser = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.userId))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        firmId: users.firmId,
        active: users.active,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({ user: updatedUser[0] });
  } catch (error) {
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

    console.error('Error updating user profile:', error);
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
