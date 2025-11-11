/**
 * Comment Service Unit Tests
 * Tests for comment thread management
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commentService } from '../comment.service';
import { db } from '@/lib/db/client';

// Mock the database
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getThreadsForDraft', () => {
    it('should fetch comment threads for a draft', async () => {
      const mockComments = [
        {
          comment: {
            id: 'comment-1',
            draftId: 'draft-1',
            threadId: 'thread-1',
            authorId: 'user-1',
            content: 'Test comment',
            selectionStart: 0,
            selectionEnd: 10,
            resolved: false,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          },
          author: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockComments),
      };

      (db.select as any).mockReturnValue(mockQuery);

      const threads = await commentService.getThreadsForDraft('draft-1', false);

      expect(threads).toHaveLength(1);
      expect(threads[0].id).toBe('thread-1');
      expect(threads[0].comments).toHaveLength(1);
      expect(threads[0].comments[0].content).toBe('Test comment');
    });

    it('should filter out resolved comments when includeResolved is false', async () => {
      const mockComments = [
        {
          comment: {
            id: 'comment-1',
            draftId: 'draft-1',
            threadId: 'thread-1',
            authorId: 'user-1',
            content: 'Active comment',
            selectionStart: 0,
            selectionEnd: 10,
            resolved: false,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          },
          author: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          comment: {
            id: 'comment-2',
            draftId: 'draft-1',
            threadId: 'thread-2',
            authorId: 'user-1',
            content: 'Resolved comment',
            selectionStart: 20,
            selectionEnd: 30,
            resolved: true,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          },
          author: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockComments),
      };

      (db.select as any).mockReturnValue(mockQuery);

      const threads = await commentService.getThreadsForDraft('draft-1', false);

      expect(threads).toHaveLength(1);
      expect(threads[0].resolved).toBe(false);
    });
  });

  describe('createComment', () => {
    it('should create a new comment thread', async () => {
      const mockDraft = [{ id: 'draft-1' }];
      const mockComment = {
        id: 'comment-1',
        draftId: 'draft-1',
        threadId: 'thread-1',
        authorId: 'user-1',
        content: 'New comment',
        selectionStart: 0,
        selectionEnd: 10,
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockAuthor = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock draft lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockDraft),
      });

      // Mock comment insert
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockComment]),
      });

      // Mock author lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockAuthor]),
      });

      const result = await commentService.createComment('draft-1', 'user-1', {
        content: 'New comment',
        selectionStart: 0,
        selectionEnd: 10,
      });

      expect(result).toBeDefined();
      expect(result.content).toBe('New comment');
      expect(result.author).toEqual(mockAuthor);
    });

    it('should throw error if draft not found', async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      });

      await expect(
        commentService.createComment('invalid-draft', 'user-1', {
          content: 'Comment',
          selectionStart: 0,
          selectionEnd: 10,
        })
      ).rejects.toThrow('Draft not found');
    });
  });

  describe('resolveThread', () => {
    it('should mark all comments in thread as resolved', async () => {
      const mockUpdate = vi.fn().mockReturnThis();

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: mockUpdate,
      });

      await commentService.resolveThread('thread-1', 'user-1');

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('unresolveThread', () => {
    it('should mark all comments in thread as unresolved', async () => {
      const mockUpdate = vi.fn().mockReturnThis();

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: mockUpdate,
      });

      await commentService.unresolveThread('thread-1', 'user-1');

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    it('should update comment content', async () => {
      const mockComment = {
        id: 'comment-1',
        authorId: 'user-1',
        content: 'Old content',
      };

      const mockUpdatedComment = {
        ...mockComment,
        content: 'New content',
        updatedAt: new Date(),
      };

      const mockAuthor = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Mock existing comment lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockComment]),
      });

      // Mock update
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedComment]),
      });

      // Mock author lookup
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockAuthor]),
      });

      const result = await commentService.updateComment('comment-1', 'user-1', {
        content: 'New content',
      });

      expect(result.content).toBe('New content');
    });

    it('should throw error if non-author tries to edit content', async () => {
      const mockComment = {
        id: 'comment-1',
        authorId: 'user-1',
        content: 'Content',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockComment]),
      });

      await expect(
        commentService.updateComment('comment-1', 'user-2', {
          content: 'New content',
        })
      ).rejects.toThrow('Only the comment author can edit the content');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const mockComment = {
        id: 'comment-1',
        authorId: 'user-1',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockComment]),
      });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await expect(
        commentService.deleteComment('comment-1', 'user-1')
      ).resolves.not.toThrow();
    });

    it('should throw error if non-author tries to delete', async () => {
      const mockComment = {
        id: 'comment-1',
        authorId: 'user-1',
      };

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockComment]),
      });

      await expect(
        commentService.deleteComment('comment-1', 'user-2')
      ).rejects.toThrow('Only the comment author can delete the comment');
    });
  });
});
