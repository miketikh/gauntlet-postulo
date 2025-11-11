/**
 * User Search API
 * Allows searching for users within the same firm
 * Story 4.11: Document Locking and Permissions UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/errors';

/**
 * GET /api/users/search
 * Search for users in the same firm by email or name
 *
 * Query parameters:
 * - q: search query (email, first name, or last name)
 * - limit: number of results (default: 10, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    if (!query || query.length < 2) {
      return NextResponse.json({
        users: [],
        message: 'Query must be at least 2 characters',
      });
    }

    // Search for users in the same firm
    const searchPattern = `%${query}%`;
    const foundUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        firmId: users.firmId,
      })
      .from(users)
      .where(
        and(
          eq(users.firmId, user.firmId),
          or(
            ilike(users.email, searchPattern),
            ilike(users.firstName, searchPattern),
            ilike(users.lastName, searchPattern)
          )
        )
      )
      .limit(limit);

    return NextResponse.json({
      users: foundUsers,
      count: foundUsers.length,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      createErrorResponse(err),
      { status: err.statusCode || 500 }
    );
  }
}
