/**
 * Yjs State API Routes
 * Load and save Yjs document state for collaborative editing
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadYjsDocumentState, saveYjsDocumentState, decodeYjsDocument, encodeYjsDocument } from '@/lib/services/yjs.service';
import { getDraftWithProject } from '@/lib/services/draft.service';
import { requireAuth } from '@/lib/middleware/auth';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

/**
 * GET /api/drafts/[id]/yjs-state
 * Load Yjs document state for a draft
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;
    const user = await requireAuth(request);

    // Get draft with project for firm validation
    const draft = await getDraftWithProject(draftId);

    // Verify user has access to this draft (same firm)
    if (draft.project.firmId !== user.firmId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }

    // Load Yjs document state
    const ydoc = await loadYjsDocumentState(draftId);

    // Encode as base64 for transmission
    const yjsState = encodeYjsDocument(ydoc);

    return NextResponse.json({
      draftId,
      yjsState,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    console.error('Error loading Yjs state:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load document state',
        },
      },
      { status: 500 }
    );
  }
}

const UpdateYjsStateSchema = z.object({
  yjsState: z.string(),
});

/**
 * PUT /api/drafts/[id]/yjs-state
 * Save Yjs document state for a draft
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;
    const user = await requireAuth(request);

    // Get draft with project for firm validation
    const draft = await getDraftWithProject(draftId);

    // Verify user has access to this draft (same firm)
    if (draft.project.firmId !== user.firmId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { yjsState } = UpdateYjsStateSchema.parse(body);

    // Decode and save Yjs document
    const ydoc = decodeYjsDocument(yjsState);
    await saveYjsDocumentState(draftId, ydoc);

    return NextResponse.json({
      success: true,
      draftId,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error saving Yjs state:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save document state',
        },
      },
      { status: 500 }
    );
  }
}
