/**
 * Draft History API - Enhanced version history with contributor tracking
 * GET /api/drafts/:id/history
 *
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 * Updated Story 4.11 - Added permission checks
 * CRITICAL: Enforces firm isolation via project relationship
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireDraftPermission } from '@/lib/middleware/permissions';
import { getSnapshotHistory } from '@/lib/services/snapshot.service';
import { createErrorResponse } from '@/lib/errors';

/**
 * GET /api/drafts/:id/history
 * Returns enhanced history with contributor tracking
 * Requires 'view' permission
 * SECURITY: Validates draft belongs to user's firm via permission check
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;

    // Require 'view' permission to see history
    await requireDraftPermission(req, draftId, 'view');

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // Get snapshot history with contributors
    const history = await getSnapshotHistory(draftId, limit);

    return NextResponse.json({
      draftId,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error fetching draft history:', error);
    const err = error as Error & { statusCode?: number };
    const errorResponse = createErrorResponse(err);
    const statusCode = err.statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
