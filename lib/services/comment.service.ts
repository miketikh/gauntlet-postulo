/**
 * Comment Service
 * Business logic for managing comment threads on text selections
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

import { db } from '@/lib/db/client';
import { comments, users, drafts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  CommentThread,
  CommentWithAuthor,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentPositionUpdate,
} from '@/lib/types/comment';

export class CommentService {
  /**
   * Get all comment threads for a draft
   */
  async getThreadsForDraft(draftId: string, includeResolved = false): Promise<CommentThread[]> {
    // Fetch all comments for the draft with author information
    const commentsQuery = db
      .select({
        comment: comments,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.draftId, draftId))
      .orderBy(desc(comments.createdAt));

    const allComments = await commentsQuery;

    // Filter by resolved status if needed
    const filteredComments = includeResolved
      ? allComments
      : allComments.filter(c => !c.comment.resolved);

    // Group comments by threadId
    const threadMap = new Map<string, CommentWithAuthor[]>();

    for (const { comment, author } of filteredComments) {
      const commentWithAuthor: CommentWithAuthor = {
        ...comment,
        author,
      };

      if (!threadMap.has(comment.threadId)) {
        threadMap.set(comment.threadId, []);
      }
      threadMap.get(comment.threadId)!.push(commentWithAuthor);
    }

    // Convert to CommentThread objects
    const threads: CommentThread[] = [];

    for (const [threadId, threadComments] of threadMap) {
      // Sort comments in each thread by creation date
      threadComments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Get the first comment (original comment) for thread metadata
      const firstComment = threadComments[0];

      threads.push({
        id: threadId,
        draftId: firstComment.draftId,
        selection: {
          start: firstComment.selectionStart,
          end: firstComment.selectionEnd,
        },
        textSnippet: '', // Will be filled by the caller with current document text
        resolved: firstComment.resolved,
        comments: threadComments,
        createdAt: firstComment.createdAt,
        updatedAt: threadComments[threadComments.length - 1].updatedAt,
      });
    }

    // Sort threads by last update time (most recent first)
    threads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return threads;
  }

  /**
   * Get a specific comment thread
   */
  async getThread(threadId: string): Promise<CommentThread | null> {
    const commentsQuery = db
      .select({
        comment: comments,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.threadId, threadId))
      .orderBy(comments.createdAt);

    const threadComments = await commentsQuery;

    if (threadComments.length === 0) {
      return null;
    }

    const firstComment = threadComments[0].comment;
    const commentsWithAuthor: CommentWithAuthor[] = threadComments.map(({ comment, author }) => ({
      ...comment,
      author,
    }));

    return {
      id: threadId,
      draftId: firstComment.draftId,
      selection: {
        start: firstComment.selectionStart,
        end: firstComment.selectionEnd,
      },
      textSnippet: '',
      resolved: firstComment.resolved,
      comments: commentsWithAuthor,
      createdAt: firstComment.createdAt,
      updatedAt: commentsWithAuthor[commentsWithAuthor.length - 1].updatedAt,
    };
  }

  /**
   * Create a new comment or add to existing thread
   */
  async createComment(
    draftId: string,
    userId: string,
    request: CreateCommentRequest
  ): Promise<CommentWithAuthor> {
    // Verify draft exists
    const draft = await db.select().from(drafts).where(eq(drafts.id, draftId)).limit(1);
    if (draft.length === 0) {
      throw new Error('Draft not found');
    }

    // If threadId not provided, create a new thread
    const threadId = request.threadId || randomUUID();

    // Insert comment
    const [newComment] = await db
      .insert(comments)
      .values({
        draftId,
        threadId,
        authorId: userId,
        content: request.content,
        selectionStart: request.selectionStart,
        selectionEnd: request.selectionEnd,
        resolved: false,
      })
      .returning();

    // Fetch author information
    const [author] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!author) {
      throw new Error('User not found');
    }

    return {
      ...newComment,
      author,
    };
  }

  /**
   * Update a comment (edit content or resolve)
   */
  async updateComment(
    commentId: string,
    userId: string,
    request: UpdateCommentRequest
  ): Promise<CommentWithAuthor> {
    // Fetch existing comment
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    // Only the author can edit content
    if (request.content !== undefined && existingComment.authorId !== userId) {
      throw new Error('Only the comment author can edit the content');
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (request.content !== undefined) {
      updateData.content = request.content;
    }

    if (request.resolved !== undefined) {
      updateData.resolved = request.resolved;
    }

    // Update comment
    const [updatedComment] = await db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, commentId))
      .returning();

    // Fetch author information
    const [author] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, updatedComment.authorId))
      .limit(1);

    if (!author) {
      throw new Error('Author not found');
    }

    return {
      ...updatedComment,
      author,
    };
  }

  /**
   * Resolve a comment thread
   * Marks all comments in the thread as resolved
   */
  async resolveThread(threadId: string, userId: string): Promise<void> {
    await db
      .update(comments)
      .set({
        resolved: true,
        updatedAt: new Date(),
      })
      .where(eq(comments.threadId, threadId));
  }

  /**
   * Unresolve a comment thread
   */
  async unresolveThread(threadId: string, userId: string): Promise<void> {
    await db
      .update(comments)
      .set({
        resolved: false,
        updatedAt: new Date(),
      })
      .where(eq(comments.threadId, threadId));
  }

  /**
   * Update comment positions after document changes
   * This is called when the document content changes and we need to adjust
   * comment selection offsets to match the new document state
   */
  async updateCommentPositions(
    draftId: string,
    updates: CommentPositionUpdate[]
  ): Promise<void> {
    // Batch update positions
    for (const update of updates) {
      await db
        .update(comments)
        .set({
          selectionStart: update.newStart,
          selectionEnd: update.newEnd,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(comments.draftId, draftId),
            eq(comments.threadId, update.threadId)
          )
        );
    }
  }

  /**
   * Delete a comment
   * Note: Only deletes individual comments, not entire threads
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    // Fetch existing comment to verify ownership
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    // Only the author can delete
    if (existingComment.authorId !== userId) {
      throw new Error('Only the comment author can delete the comment');
    }

    await db.delete(comments).where(eq(comments.id, commentId));
  }

  /**
   * Get comment count for a draft
   */
  async getCommentCount(draftId: string, includeResolved = false): Promise<number> {
    const query = includeResolved
      ? db.select().from(comments).where(eq(comments.draftId, draftId))
      : db.select().from(comments).where(
          and(
            eq(comments.draftId, draftId),
            eq(comments.resolved, false)
          )
        );

    const result = await query;
    return result.length;
  }
}

// Export singleton instance
export const commentService = new CommentService();
