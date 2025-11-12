/**
 * Comment API Routes
 * PATCH /api/comments/[id] - Update a comment (edit content or resolve)
 * DELETE /api/comments/[id] - Delete a comment
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { commentService } from '@/lib/services/comment.service';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// Validation schema for updating a comment
const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  resolved: z.boolean().optional(),
}).refine(
  (data) => data.content !== undefined || data.resolved !== undefined,
  {
    message: 'At least one field (content or resolved) must be provided',
  }
);

/**
 * PATCH /api/comments/[id]
 * Update a comment (edit content or resolve status)
 *
 * Request body:
 * {
 *   content?: string;
 *   resolved?: boolean;
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: commentId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const data = updateCommentSchema.parse(body);

    // Update comment
    const comment = await commentService.updateComment(commentId, user.userId, {
      content: data.content,
      resolved: data.resolved,
    });

    logger.info('Comment updated', {
      action: 'comments.update',
      userId: user.userId,
      commentId,
      threadId: comment.threadId,
      resolved: data.resolved,
    });

    // TODO: Broadcast via WebSocket for real-time updates
    // This will be implemented in the WebSocket integration step

    return NextResponse.json({
      comment,
    });
  } catch (error) {
    logger.error('Failed to update comment', {
      action: 'comments.update',
      error: error instanceof Error ? error.message : String(error),
    });

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

    if (error instanceof Error && error.message === 'Comment not found') {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Comment not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('Only the comment author')) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update comment',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * Delete a comment
 *
 * Note: Only the comment author can delete their own comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: commentId } = await params;

    // Delete comment
    await commentService.deleteComment(commentId, user.userId);

    logger.info('Comment deleted', {
      action: 'comments.delete',
      userId: user.userId,
      commentId,
    });

    // TODO: Broadcast via WebSocket for real-time updates

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error('Failed to delete comment', {
      action: 'comments.delete',
      error: error instanceof Error ? error.message : String(error),
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

    if (error instanceof Error && error.message === 'Comment not found') {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Comment not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('Only the comment author')) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete comment',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
