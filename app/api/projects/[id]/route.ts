/**
 * Single Project API - Get project by ID (firm-isolated)
 * CRITICAL: Returns 404 (not 403) for cross-firm access
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError, createErrorResponse } from '@/lib/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id
 * Returns single project if it belongs to authenticated user's firm
 * SECURITY: Returns 404 (not 403) if project doesn't exist or belongs to different firm
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth(req);
    const { id: projectId } = await context.params;

    // CRITICAL: Filter by BOTH id AND firmId
    // This ensures users can only access projects from their firm
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.firmId, user.firmId)
      ),
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        template: true,
        sourceDocuments: true,
        draft: true,
      }
    });

    // CRITICAL: Return 404, not 403, to avoid information disclosure
    // This prevents attackers from knowing if a project ID exists
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
