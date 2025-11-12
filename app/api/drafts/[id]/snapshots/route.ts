/**
 * Manual Snapshot API - Create snapshot on demand
 * POST /api/drafts/:id/snapshots
 *
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 * Updated Story 4.11 - Added permission checks
 * CRITICAL: Enforces firm isolation via permission check
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireDraftPermission } from '@/lib/middleware/permissions';
import { createManualSnapshot } from '@/lib/services/snapshot.service';
import { createErrorResponse } from '@/lib/errors';
import { z } from 'zod';

const createSnapshotSchema = z.object({
  changeDescription: z.string().optional(),
});

/**
 * POST /api/drafts/:id/snapshots
 * Create a manual snapshot
 * Requires 'edit' permission
 * SECURITY: Validates draft belongs to user's firm via permission check
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;

    // Require 'edit' permission to create snapshots
    const ctx = await requireDraftPermission(req, draftId, 'edit');

    // Parse and validate request body
    const body = await req.json();
    const data = createSnapshotSchema.parse(body);

    // Create manual snapshot
    const version = await createManualSnapshot(
      draftId,
      ctx.user.userId,
      data.changeDescription
    );

    return NextResponse.json(
      {
        draftId,
        version,
        message: 'Snapshot created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating manual snapshot:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const err = error as Error & { statusCode?: number };
    const errorResponse = createErrorResponse(err);
    const statusCode = err.statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
