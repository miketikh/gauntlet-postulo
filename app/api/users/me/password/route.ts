/**
 * User Password Change API Route
 * POST /api/users/me/password - Change current user's password
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/middleware/auth';
import { hashPassword, verifyPassword } from '@/lib/services/auth.service';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * POST /api/users/me/password
 * Change current user's password
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    // Get current user with password hash
    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
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

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      data.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Check that new password is different from current
    const isSamePassword = await verifyPassword(
      data.newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'New password must be different from current password',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(data.newPassword);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.userId));

    return NextResponse.json(
      {
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
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

    console.error('Error changing password:', error);
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
