/**
 * GET /api/admin/users
 * Admin-only endpoint to list all users in the authenticated user's firm
 * Based on architecture.md RBAC patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { createErrorResponse, ForbiddenError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

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
