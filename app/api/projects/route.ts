/**
 * Projects API - List all projects for user's firm
 * CRITICAL: All queries filtered by firmId for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/errors';

/**
 * GET /api/projects
 * Returns all projects belonging to authenticated user's firm
 * SECURITY: Automatically filters by firmId from JWT
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // CRITICAL: Filter by firmId from JWT
    // This ensures users can only see projects from their firm
    const firmProjects = await db.query.projects.findMany({
      where: eq(projects.firmId, user.firmId),
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        template: {
          columns: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({
      projects: firmProjects,
      count: firmProjects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
