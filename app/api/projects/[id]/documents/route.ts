/**
 * Project Documents API
 * GET /api/projects/:id/documents
 * Returns all source documents for a project (firm-isolated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { sourceDocuments, projects } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NotFoundError, createErrorResponse } from '@/lib/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id/documents
 * Returns all source documents for a project if it belongs to authenticated user's firm
 * SECURITY: Returns 404 if project doesn't exist or belongs to different firm
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(req);
    const { id: projectId } = await context.params;

    // CRITICAL: Verify project exists and belongs to user's firm
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.firmId, user.firmId)),
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Fetch all source documents for this project
    const documents = await db.query.sourceDocuments.findMany({
      where: eq(sourceDocuments.projectId, projectId),
      orderBy: [desc(sourceDocuments.createdAt)],
      with: {
        uploader: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Get project documents error:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
