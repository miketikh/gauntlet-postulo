/**
 * Admin Users API Routes
 * GET /api/admin/users - List all users in firm (admin only)
 * POST /api/admin/users - Create new user (admin only)
 * Story 6.13 - Admin Panel Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { createErrorResponse, ForbiddenError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8),
  role: z.enum(['admin', 'attorney', 'paralegal']),
});

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Require admin role
    requireRole(user, ['admin']);

    // Query all users in the same firm
    const firmUsers = await db.query.users.findMany({
      where: eq(users.firmId, user.firmId),
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
        // Exclude passwordHash from response
        passwordHash: false,
      },
    });

    return NextResponse.json(
      {
        users: firmUsers,
        count: firmUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin users endpoint error:', error);

    // Handle ForbiddenError (insufficient role)
    if (error instanceof ForbiddenError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    // Handle other custom errors
    if (error instanceof Error && 'statusCode' in error) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, {
        status: (error as any).statusCode || 500
      });
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

/**
 * POST /api/admin/users
 * Create new user in the firm
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    requireRole(auth, ['admin']);

    const body = await request.json();
    const data = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
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

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        role: data.role,
        firmId: auth.firmId,
        active: true,
      })
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

    return NextResponse.json(
      {
        user: newUser[0],
      },
      { status: 201 }
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

    if (error instanceof ForbiddenError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    console.error('Error creating user:', error);
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
