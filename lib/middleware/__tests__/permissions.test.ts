/**
 * Permission Middleware Tests
 * Story 4.11: Document Locking and Permissions UI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  requireDraftPermission,
  requireOwnerPermission,
  optionalDraftPermission,
} from '../permissions';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

// Mock dependencies
vi.mock('../auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('../../services/permission.service', () => ({
  checkDraftPermission: vi.fn(),
}));

import { requireAuth } from '../auth';
import { checkDraftPermission } from '../../services/permission.service';

describe('Permission Middleware', () => {
  const mockUser = {
    userId: 'user-123',
    email: 'user@test.com',
    role: 'attorney' as const,
    firmId: 'firm-123',
  };

  const mockDraftId = 'draft-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireDraftPermission', () => {
    it('should return permission context for user with view permission', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('view');

      const mockRequest = {} as NextRequest;
      const result = await requireDraftPermission(mockRequest, mockDraftId, 'view');

      expect(result.user).toEqual(mockUser);
      expect(result.draftId).toBe(mockDraftId);
      expect(result.permission).toBe('view');
      expect(result.isOwner).toBe(false);
      expect(result.canEdit).toBe(false);
      expect(result.canComment).toBe(false);
      expect(result.canView).toBe(true);
    });

    it('should return permission context for user with comment permission', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('comment');

      const mockRequest = {} as NextRequest;
      const result = await requireDraftPermission(mockRequest, mockDraftId, 'view');

      expect(result.permission).toBe('comment');
      expect(result.isOwner).toBe(false);
      expect(result.canEdit).toBe(false);
      expect(result.canComment).toBe(true);
      expect(result.canView).toBe(true);
    });

    it('should return permission context for user with edit permission', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('edit');

      const mockRequest = {} as NextRequest;
      const result = await requireDraftPermission(mockRequest, mockDraftId, 'view');

      expect(result.permission).toBe('edit');
      expect(result.isOwner).toBe(false);
      expect(result.canEdit).toBe(true);
      expect(result.canComment).toBe(true);
      expect(result.canView).toBe(true);
    });

    it('should return permission context for owner', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('owner');

      const mockRequest = {} as NextRequest;
      const result = await requireDraftPermission(mockRequest, mockDraftId, 'view');

      expect(result.permission).toBe('owner');
      expect(result.isOwner).toBe(true);
      expect(result.canEdit).toBe(true);
      expect(result.canComment).toBe(true);
      expect(result.canView).toBe(true);
    });

    it('should throw NotFoundError if user has no permission', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue(null);

      const mockRequest = {} as NextRequest;

      await expect(
        requireDraftPermission(mockRequest, mockDraftId, 'view')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user has view but needs comment permission', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('view');

      const mockRequest = {} as NextRequest;

      await expect(
        requireDraftPermission(mockRequest, mockDraftId, 'comment')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError if user has comment but needs edit permission', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('comment');

      const mockRequest = {} as NextRequest;

      await expect(
        requireDraftPermission(mockRequest, mockDraftId, 'edit')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow owner to access with any required permission', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('owner');

      const mockRequest = {} as NextRequest;

      // Owner should be able to access with any required permission level
      await expect(
        requireDraftPermission(mockRequest, mockDraftId, 'view')
      ).resolves.toBeDefined();

      await expect(
        requireDraftPermission(mockRequest, mockDraftId, 'comment')
      ).resolves.toBeDefined();

      await expect(
        requireDraftPermission(mockRequest, mockDraftId, 'edit')
      ).resolves.toBeDefined();
    });
  });

  describe('requireOwnerPermission', () => {
    it('should return permission context for owner', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('owner');

      const mockRequest = {} as NextRequest;
      const result = await requireOwnerPermission(mockRequest, mockDraftId);

      expect(result.isOwner).toBe(true);
      expect(result.permission).toBe('owner');
    });

    it('should throw ForbiddenError if user is not owner', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('edit');

      const mockRequest = {} as NextRequest;

      await expect(requireOwnerPermission(mockRequest, mockDraftId)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('should throw ForbiddenError with correct message for non-owner', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('comment');

      const mockRequest = {} as NextRequest;

      await expect(requireOwnerPermission(mockRequest, mockDraftId)).rejects.toThrow(
        'Only the draft owner can perform this action'
      );
    });
  });

  describe('optionalDraftPermission', () => {
    it('should return permission context if user has access', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue('edit');

      const mockRequest = {} as NextRequest;
      const result = await optionalDraftPermission(mockRequest, mockDraftId);

      expect(result).not.toBeNull();
      expect(result?.permission).toBe('edit');
      expect(result?.canEdit).toBe(true);
    });

    it('should return null if user has no permission', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockResolvedValue(null);

      const mockRequest = {} as NextRequest;
      const result = await optionalDraftPermission(mockRequest, mockDraftId);

      expect(result).toBeNull();
    });

    it('should return null if authentication fails', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('Auth failed'));

      const mockRequest = {} as NextRequest;
      const result = await optionalDraftPermission(mockRequest, mockDraftId);

      expect(result).toBeNull();
    });

    it('should return null if checkDraftPermission throws error', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
      vi.mocked(checkDraftPermission).mockRejectedValue(new Error('Permission check failed'));

      const mockRequest = {} as NextRequest;
      const result = await optionalDraftPermission(mockRequest, mockDraftId);

      expect(result).toBeNull();
    });
  });
});
