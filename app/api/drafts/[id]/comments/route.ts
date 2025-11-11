/**
 * Draft Comments API Routes
 * GET /api/drafts/[id]/comments - List all comment threads for a draft
 * POST /api/drafts/[id]/comments - Create a new comment or reply to thread
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 * Updated Story 4.11 - Added permission checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireDraftPermission } from '@/lib/middleware/permissions';
import { commentService } from '@/lib/services/comment.service';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { createErrorResponse } from '@/lib/errors';

// Validation schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000),
  selectionStart: z.number().int().min(0),
  selectionEnd: z.number().int().min(0),
  textSnippet: z.string().optional(),
  threadId: z.string().uuid().optional(),
});

/**
 * GET /api/drafts/[id]/comments
 * List all comment threads for a draft
 * Requires 'view' permission
 *
 * Query parameters:
 * - includeResolved: boolean (default: false) - whether to include resolved threads
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = params.id;

    // Require 'view' permission to see comments
    const ctx = await requireDraftPermission(request, draftId, 'view');

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get('includeResolved') === 'true';

    // Fetch comment threads
    const threads = await commentService.getThreadsForDraft(draftId, includeResolved);

    logger.info('Comment threads fetched', {
      action: 'comments.list',
      userId: ctx.user.userId,
      draftId,
      threadCount: threads.length,
      includeResolved,
    });

    return NextResponse.json({
      threads,
      count: threads.length,
    });
  } catch (error) {
    logger.error('Failed to fetch comment threads', {
      action: 'comments.list',
      error: error instanceof Error ? error.message : String(error),
      draftId: params.id,
    });

    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      createErrorResponse(err),
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * POST /api/drafts/[id]/comments
 * Create a new comment or reply to an existing thread
 * Requires 'comment' or 'edit' permission
 *
 * Request body:
 * {
 *   content: string;
 *   selectionStart: number;
 *   selectionEnd: number;
 *   textSnippet?: string;
 *   threadId?: string; // Optional: if replying to existing thread
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = params.id;

    // Require 'comment' permission to create comments
    const ctx = await requireDraftPermission(request, draftId, 'comment');

    // Parse and validate request body
    const body = await request.json();
    const data = createCommentSchema.parse(body);

    // Create comment
    const comment = await commentService.createComment(draftId, ctx.user.userId, {
      content: data.content,
      selectionStart: data.selectionStart,
      selectionEnd: data.selectionEnd,
      textSnippet: data.textSnippet,
      threadId: data.threadId,
    });

    logger.info('Comment created', {
      action: 'comments.create',
      userId: ctx.user.userId,
      draftId,
      commentId: comment.id,
      threadId: comment.threadId,
      isReply: !!data.threadId,
    });

    // TODO: Broadcast via WebSocket for real-time updates
    // This will be implemented in the WebSocket integration step

    return NextResponse.json(
      {
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create comment', {
      action: 'comments.create',
      error: error instanceof Error ? error.message : String(error),
      draftId: params.id,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      createErrorResponse(err),
      { status: err.statusCode || 500 }
    );
  }
}
