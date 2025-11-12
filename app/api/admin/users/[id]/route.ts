/**
 * Admin User Detail API Routes
 * GET /api/admin/users/[id] - Get user details (admin only)
 * PATCH /api/admin/users/[id] - Update user (admin only)
 * DELETE /api/admin/users/[id] - Deactivate user (admin only)
 * Story 6.13 - Admin Panel Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { createErrorResponse, ForbiddenError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'attorney', 'paralegal']).optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/admin/users/[id]
 * Get user details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    requireRole(auth, ['admin']);

    const { id } = await params;

    const user = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.firmId, auth.firmId)),
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
    if (error instanceof ForbiddenError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    console.error('Error fetching user:', error);
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
 * PATCH /api/admin/users/[id]
 * Update user details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    requireRole(auth, ['admin']);

    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    // Check if user exists and belongs to same firm
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.firmId, auth.firmId)),
    });

    if (!existingUser) {
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

    // If email is being changed, check for conflicts
    if (data.email && data.email !== existingUser.email) {
      const emailConflict = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });

      if (emailConflict) {
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

    // Update user
    const updatedUser = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.firmId, auth.firmId)))
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

    if (error instanceof ForbiddenError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    console.error('Error updating user:', error);
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
 * DELETE /api/admin/users/[id]
 * Deactivate user (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    requireRole(auth, ['admin']);

    const { id } = await params;

    // Check if user exists and belongs to same firm
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.firmId, auth.firmId)),
    });

    if (!existingUser) {
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

    // Prevent deleting yourself
    if (id === auth.userId) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot deactivate your own account',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      );
    }

    // Soft delete: set active = false
    await db
      .update(users)
      .set({
        active: false,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.firmId, auth.firmId)));

    return NextResponse.json(
      {
        message: 'User deactivated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    console.error('Error deactivating user:', error);
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
