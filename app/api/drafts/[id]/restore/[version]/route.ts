/**
 * Draft Version Restore API - Restore previous version
 * POST /api/drafts/:id/restore/:version
 *
 * CRITICAL: Enforces firm isolation via project relationship
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { restoreDraftVersion, getDraftWithProject } from '@/lib/services/draft.service';
import { createErrorResponse, NotFoundError, ValidationError } from '@/lib/errors';

/**
 * POST /api/drafts/:id/restore/:version
 * Restores a previous version as a new snapshot
 * SECURITY: Validates draft belongs to user's firm via project relationship
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const user = await requireAuth(req);
    const draftId = params.id;
    const version = parseInt(params.version, 10);

    // Validate version is a valid number
    if (isNaN(version) || version < 1) {
      throw new ValidationError('Invalid version number');
    }

    // Verify draft belongs to user's firm (via project)
    const draft = await getDraftWithProject(draftId);

    if (draft.project.firmId !== user.firmId) {
      // Return 404 instead of 403 to avoid information disclosure
      throw new NotFoundError('Draft not found');
    }

    // Restore version (creates new snapshot)
    const newVersion = await restoreDraftVersion(
      draftId,
      version,
      user.userId
    );

    return NextResponse.json({
      message: 'Version restored successfully',
      newVersion,
      restoredFrom: version
    }, { status: 200 });
  } catch (error) {
    console.error('Error restoring draft version:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
