/**
 * Comment API Integration Tests
 * Tests for comment thread API endpoints
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getComments, POST as createComment } from '../../drafts/[id]/comments/route';
import { PATCH as updateComment, DELETE as deleteComment } from '../[id]/route';
import { POST as resolveThread, DELETE as unresolveThread } from '../threads/[id]/resolve/route';

// Mock authentication
vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'attorney',
    firmId: 'test-firm-id',
  }),
}));

// Mock comment service
const mockThreads = [
  {
    id: 'thread-1',
    draftId: 'draft-1',
    selection: { start: 0, end: 10 },
    textSnippet: 'test text',
    resolved: false,
    comments: [
      {
        id: 'comment-1',
        draftId: 'draft-1',
        threadId: 'thread-1',
        authorId: 'test-user-id',
        content: 'Test comment',
        selectionStart: 0,
        selectionEnd: 10,
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: 'test-user-id',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock('@/lib/services/comment.service', () => ({
  commentService: {
    getThreadsForDraft: vi.fn().mockResolvedValue(mockThreads),
    createComment: vi.fn().mockResolvedValue({
      id: 'comment-2',
      draftId: 'draft-1',
      threadId: 'thread-1',
      authorId: 'test-user-id',
      content: 'New comment',
      selectionStart: 0,
      selectionEnd: 10,
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
    }),
    updateComment: vi.fn().mockResolvedValue({
      id: 'comment-1',
      draftId: 'draft-1',
      threadId: 'thread-1',
      authorId: 'test-user-id',
      content: 'Updated comment',
      selectionStart: 0,
      selectionEnd: 10,
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
    }),
    deleteComment: vi.fn().mockResolvedValue(undefined),
    resolveThread: vi.fn().mockResolvedValue(undefined),
    unresolveThread: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Comment API Integration Tests', () => {
  describe('GET /api/drafts/[id]/comments', () => {
    it('should return comment threads for a draft', async () => {
      const request = new NextRequest('http://localhost:3000/api/drafts/draft-1/comments');
      const params = { params: { id: 'draft-1' } };

      const response = await getComments(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.threads).toBeDefined();
      expect(data.threads).toHaveLength(1);
      expect(data.count).toBe(1);
    });

    it('should support includeResolved query parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/drafts/draft-1/comments?includeResolved=true'
      );
      const params = { params: { id: 'draft-1' } };

      const response = await getComments(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.threads).toBeDefined();
    });
  });

  describe('POST /api/drafts/[id]/comments', () => {
    it('should create a new comment', async () => {
      const requestBody = {
        content: 'New comment',
        selectionStart: 0,
        selectionEnd: 10,
      };

      const request = new NextRequest('http://localhost:3000/api/drafts/draft-1/comments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      const params = { params: { id: 'draft-1' } };

      const response = await createComment(request, params);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment).toBeDefined();
      expect(data.comment.content).toBe('New comment');
    });

    it('should validate required fields', async () => {
      const requestBody = {
        content: '',
        selectionStart: 0,
        selectionEnd: 10,
      };

      const request = new NextRequest('http://localhost:3000/api/drafts/draft-1/comments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      const params = { params: { id: 'draft-1' } };

      const response = await createComment(request, params);

      expect(response.status).toBe(400);
    });

    it('should support replying to existing thread', async () => {
      const requestBody = {
        content: 'Reply comment',
        selectionStart: 0,
        selectionEnd: 10,
        threadId: 'thread-1',
      };

      const request = new NextRequest('http://localhost:3000/api/drafts/draft-1/comments', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      const params = { params: { id: 'draft-1' } };

      const response = await createComment(request, params);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment).toBeDefined();
    });
  });

  describe('PATCH /api/comments/[id]', () => {
    it('should update comment content', async () => {
      const requestBody = {
        content: 'Updated content',
      };

      const request = new NextRequest('http://localhost:3000/api/comments/comment-1', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });
      const params = { params: { id: 'comment-1' } };

      const response = await updateComment(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comment).toBeDefined();
      expect(data.comment.content).toBe('Updated comment');
    });

    it('should update resolved status', async () => {
      const requestBody = {
        resolved: true,
      };

      const request = new NextRequest('http://localhost:3000/api/comments/comment-1', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });
      const params = { params: { id: 'comment-1' } };

      const response = await updateComment(request, params);

      expect(response.status).toBe(200);
    });

    it('should require at least one field', async () => {
      const requestBody = {};

      const request = new NextRequest('http://localhost:3000/api/comments/comment-1', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      });
      const params = { params: { id: 'comment-1' } };

      const response = await updateComment(request, params);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/comments/[id]', () => {
    it('should delete a comment', async () => {
      const request = new NextRequest('http://localhost:3000/api/comments/comment-1', {
        method: 'DELETE',
      });
      const params = { params: { id: 'comment-1' } };

      const response = await deleteComment(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/comments/threads/[id]/resolve', () => {
    it('should resolve a thread', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/comments/threads/thread-1/resolve',
        {
          method: 'POST',
        }
      );
      const params = { params: { id: 'thread-1' } };

      const response = await resolveThread(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resolved).toBe(true);
    });
  });

  describe('DELETE /api/comments/threads/[id]/resolve', () => {
    it('should unresolve a thread', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/comments/threads/thread-1/resolve',
        {
          method: 'DELETE',
        }
      );
      const params = { params: { id: 'thread-1' } };

      const response = await unresolveThread(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resolved).toBe(false);
    });
  });
});
