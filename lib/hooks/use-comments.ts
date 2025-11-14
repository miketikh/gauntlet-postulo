/**
 * useComments Hook
 * Manages comment threads for a draft
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommentThread, CreateCommentRequest } from '@/lib/types/comment';
import { apiClient } from '@/lib/api/client';

export interface UseCommentsOptions {
  draftId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseCommentsReturn {
  threads: CommentThread[];
  isLoading: boolean;
  error: Error | null;
  createComment: (request: CreateCommentRequest) => Promise<void>;
  replyToThread: (threadId: string, content: string) => Promise<void>;
  resolveThread: (threadId: string) => Promise<void>;
  unresolveThread: (threadId: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage comment threads for a draft
 *
 * Features:
 * - Fetch comment threads
 * - Create new comments
 * - Reply to threads
 * - Resolve/unresolve threads
 * - Edit and delete comments
 * - Auto-refresh
 */
export function useComments({
  draftId,
  autoRefresh = false,
  refreshInterval = 30000,
}: UseCommentsOptions): UseCommentsReturn {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch comment threads
   */
  const fetchThreads = useCallback(async () => {
    try {
      setError(null);
      const { data } = await apiClient.get(`/api/drafts/${draftId}/comments`);
      setThreads(data.threads || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Failed to fetch comment threads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  /**
   * Create a new comment
   */
  const createComment = useCallback(
    async (request: CreateCommentRequest) => {
      try {
        await apiClient.post(`/api/drafts/${draftId}/comments`, request);

        // Refresh threads to include new comment
        await fetchThreads();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Failed to create comment:', error);
        throw error;
      }
    },
    [draftId, fetchThreads]
  );

  /**
   * Reply to an existing thread
   */
  const replyToThread = useCallback(
    async (threadId: string, content: string) => {
      // Find the thread to get selection information
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      await createComment({
        content,
        selectionStart: thread.selection.start,
        selectionEnd: thread.selection.end,
        threadId,
      });
    },
    [threads, createComment]
  );

  /**
   * Resolve a thread
   */
  const resolveThread = useCallback(
    async (threadId: string) => {
      try {
        await apiClient.post(`/api/comments/threads/${threadId}/resolve`);

        // Update local state
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  resolved: true,
                  comments: thread.comments.map((c) => ({
                    ...c,
                    resolved: true,
                  })),
                }
              : thread
          )
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Failed to resolve thread:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Unresolve a thread
   */
  const unresolveThread = useCallback(
    async (threadId: string) => {
      try {
        await apiClient.delete(`/api/comments/threads/${threadId}/resolve`);

        // Update local state
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  resolved: false,
                  comments: thread.comments.map((c) => ({
                    ...c,
                    resolved: false,
                  })),
                }
              : thread
          )
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Failed to unresolve thread:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Edit a comment
   */
  const editComment = useCallback(
    async (commentId: string, content: string) => {
      try {
        await apiClient.patch(`/api/comments/${commentId}`, { content });

        // Refresh threads to get updated comment
        await fetchThreads();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Failed to edit comment:', error);
        throw error;
      }
    },
    [fetchThreads]
  );

  /**
   * Delete a comment
   */
  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await apiClient.delete(`/api/comments/${commentId}`);

        // Refresh threads to remove deleted comment
        await fetchThreads();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('Failed to delete comment:', error);
        throw error;
      }
    },
    [fetchThreads]
  );

  /**
   * Manually refresh threads
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchThreads();
  }, [fetchThreads]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  /**
   * Auto-refresh
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchThreads();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchThreads]);

  return {
    threads,
    isLoading,
    error,
    createComment,
    replyToThread,
    resolveThread,
    unresolveThread,
    editComment,
    deleteComment,
    refresh,
  };
}
