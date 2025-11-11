/**
 * Draft Diff API - Compare two versions
 * GET /api/drafts/:id/diff?from=1&to=2
 *
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 * CRITICAL: Enforces firm isolation via project relationship
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getDraftWithProject } from '@/lib/services/draft.service';
import { compareSnapshots } from '@/lib/services/snapshot.service';
import { createErrorResponse, NotFoundError } from '@/lib/errors';

/**
 * GET /api/drafts/:id/diff?from=1&to=2
 * Returns diff between two versions
 * SECURITY: Validates draft belongs to user's firm via project relationship
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const draftId = params.id;

    // Verify draft belongs to user's firm (via project)
    const draft = await getDraftWithProject(draftId);

    if (draft.project.firmId !== user.firmId) {
      // Return 404 instead of 403 to avoid information disclosure
      throw new NotFoundError('Draft not found');
    }

    // Get query parameters
    const url = new URL(req.url);
    const fromVersion = parseInt(url.searchParams.get('from') || '1', 10);
    const toVersion = parseInt(url.searchParams.get('to') || '2', 10);

    if (fromVersion >= toVersion) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'from version must be less than to version',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Compare snapshots
    const diff = await compareSnapshots(draftId, fromVersion, toVersion);

    return NextResponse.json({
      draftId,
      diff,
    });
  } catch (error) {
    console.error('Error comparing draft versions:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
