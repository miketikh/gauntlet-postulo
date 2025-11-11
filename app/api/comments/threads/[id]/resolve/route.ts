/**
 * Comment Thread Resolve API Routes
 * POST /api/comments/threads/[id]/resolve - Resolve a comment thread
 * DELETE /api/comments/threads/[id]/resolve - Unresolve a comment thread
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { commentService } from '@/lib/services/comment.service';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/comments/threads/[id]/resolve
 * Mark a comment thread as resolved
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const threadId = params.id;

    // Resolve thread
    await commentService.resolveThread(threadId, user.userId);

    logger.info('Comment thread resolved', {
      action: 'comments.thread.resolve',
      userId: user.userId,
      threadId,
    });

    // TODO: Broadcast via WebSocket for real-time updates

    return NextResponse.json({
      success: true,
      threadId,
      resolved: true,
    });
  } catch (error) {
    logger.error('Failed to resolve comment thread', {
      action: 'comments.thread.resolve',
      error: error instanceof Error ? error.message : String(error),
      threadId: params.id,
    });

    if (error instanceof Error && error.message === 'Missing authentication token') {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to resolve comment thread',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/threads/[id]/resolve
 * Mark a comment thread as unresolved
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const threadId = params.id;

    // Unresolve thread
    await commentService.unresolveThread(threadId, user.userId);

    logger.info('Comment thread unresolved', {
      action: 'comments.thread.unresolve',
      userId: user.userId,
      threadId,
    });

    // TODO: Broadcast via WebSocket for real-time updates

    return NextResponse.json({
      success: true,
      threadId,
      resolved: false,
    });
  } catch (error) {
    logger.error('Failed to unresolve comment thread', {
      action: 'comments.thread.unresolve',
      error: error instanceof Error ? error.message : String(error),
      threadId: params.id,
    });

    if (error instanceof Error && error.message === 'Missing authentication token') {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unresolve comment thread',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
