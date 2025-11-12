/**
 * Get Draft by Project ID API
 * GET /api/projects/:id/draft
 * Returns the draft associated with a project (firm-isolated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { drafts, projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError, createErrorResponse } from '@/lib/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id/draft
 * Returns draft for a project if it belongs to authenticated user's firm
 * SECURITY: Returns 404 if project doesn't exist or belongs to different firm
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(req);
    const { id: projectId } = await context.params;

    // First verify project exists and belongs to user's firm
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.firmId, user.firmId)),
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Find draft for this project
    const draft = await db.query.drafts.findFirst({
      where: eq(drafts.projectId, projectId),
    });

    // Valid case: project exists but no draft yet (draft created during AI generation)
    if (!draft) {
      return NextResponse.json(
        {
          draft: null,
          message: 'No draft has been generated for this project yet',
        },
        { status: 200 }
      );
    }

    // Return draft data
    console.log('[API /projects/[id]/draft] Draft plainText length:', draft.plainText?.length || 0);
    return NextResponse.json({
      draft: {
        id: draft.id,
        projectId: draft.projectId,
        content: draft.content,
        yjsDocument: draft.yjsDocument,
        plainText: draft.plainText,
        currentVersion: draft.currentVersion,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get draft by project ID error:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
