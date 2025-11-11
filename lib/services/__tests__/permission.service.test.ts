/**
 * Permission Service Tests
 * Story 4.11: Document Locking and Permissions UI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkDraftPermission,
  getDraftOwner,
  addCollaborator,
  updateCollaboratorPermission,
  removeCollaborator,
  getCollaborators,
  getOwnerInfo,
} from '../permission.service';
import { db } from '@/lib/db/client';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      drafts: {
        findFirst: vi.fn(),
      },
      draftCollaborators: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

describe('Permission Service', () => {
  const mockFirmId = 'firm-123';
  const mockUserId = 'user-123';
  const mockDraftId = 'draft-123';
  const mockOwnerId = 'owner-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDraftPermission', () => {
    it('should return "owner" if user is the project creator', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockUserId,
          creator: {
            id: mockUserId,
            email: 'owner@test.com',
            firstName: 'Owner',
            lastName: 'User',
          },
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      const result = await checkDraftPermission(mockDraftId, mockUserId, mockFirmId);

      expect(result).toBe('owner');
    });

    it('should return collaborator permission if user is a collaborator', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      const mockCollaborator = {
        id: 'collab-123',
        draftId: mockDraftId,
        userId: mockUserId,
        permission: 'edit' as const,
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.query.draftCollaborators.findFirst).mockResolvedValue(mockCollaborator as any);

      const result = await checkDraftPermission(mockDraftId, mockUserId, mockFirmId);

      expect(result).toBe('edit');
    });

    it('should return null if user has no access', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.query.draftCollaborators.findFirst).mockResolvedValue(null);

      const result = await checkDraftPermission(mockDraftId, mockUserId, mockFirmId);

      expect(result).toBeNull();
    });

    it('should return null if draft is in different firm (firm isolation)', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: 'different-firm-456',
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      const result = await checkDraftPermission(mockDraftId, mockUserId, mockFirmId);

      expect(result).toBeNull();
    });

    it('should return null if draft does not exist', async () => {
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(null);

      const result = await checkDraftPermission(mockDraftId, mockUserId, mockFirmId);

      expect(result).toBeNull();
    });
  });

  describe('getDraftOwner', () => {
    it('should return owner user ID', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      const result = await getDraftOwner(mockDraftId, mockFirmId);

      expect(result).toBe(mockOwnerId);
    });

    it('should throw NotFoundError if draft not found', async () => {
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(null);

      await expect(getDraftOwner(mockDraftId, mockFirmId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for cross-firm access', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: 'different-firm-456',
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      await expect(getDraftOwner(mockDraftId, mockFirmId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('addCollaborator', () => {
    it('should throw ForbiddenError if inviter is not the owner', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      await expect(
        addCollaborator(mockDraftId, 'user-456', 'edit', 'not-owner-789', mockFirmId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if user to add does not exist', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null);

      await expect(
        addCollaborator(mockDraftId, 'nonexistent-user', 'edit', mockOwnerId, mockFirmId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is from different firm', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      const mockUser = {
        id: 'user-456',
        firmId: 'different-firm-789',
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      await expect(
        addCollaborator(mockDraftId, 'user-456', 'edit', mockOwnerId, mockFirmId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw Error if trying to add owner as collaborator', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      const mockUser = {
        id: mockOwnerId,
        firmId: mockFirmId,
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      await expect(
        addCollaborator(mockDraftId, mockOwnerId, 'edit', mockOwnerId, mockFirmId)
      ).rejects.toThrow('User is already the owner of this draft');
    });
  });

  describe('updateCollaboratorPermission', () => {
    it('should throw ForbiddenError if requester is not the owner', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      await expect(
        updateCollaboratorPermission(mockDraftId, 'user-456', 'view', 'not-owner-789', mockFirmId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError if trying to modify owner permissions', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      await expect(
        updateCollaboratorPermission(mockDraftId, mockOwnerId, 'view', mockOwnerId, mockFirmId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('removeCollaborator', () => {
    it('should throw ForbiddenError if requester is not the owner', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      await expect(
        removeCollaborator(mockDraftId, 'user-456', 'not-owner-789', mockFirmId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw Error if trying to remove the owner', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
          createdBy: mockOwnerId,
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      await expect(
        removeCollaborator(mockDraftId, mockOwnerId, mockOwnerId, mockFirmId)
      ).rejects.toThrow('Cannot remove the draft owner');
    });
  });

  describe('getCollaborators', () => {
    it('should return list of collaborators with user details', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: mockFirmId,
        },
      };

      const mockCollaborators = [
        {
          id: 'collab-1',
          draftId: mockDraftId,
          userId: 'user-1',
          permission: 'edit',
          invitedBy: mockOwnerId,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-1',
            email: 'user1@test.com',
            firstName: 'User',
            lastName: 'One',
          },
        },
      ];

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.query.draftCollaborators.findMany).mockResolvedValue(mockCollaborators as any);

      const result = await getCollaborators(mockDraftId, mockFirmId);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].permission).toBe('edit');
      expect(result[0].user.email).toBe('user1@test.com');
    });

    it('should throw NotFoundError if draft not found', async () => {
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(null);

      await expect(getCollaborators(mockDraftId, mockFirmId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for cross-firm access', async () => {
      const mockDraft = {
        id: mockDraftId,
        project: {
          id: 'project-123',
          firmId: 'different-firm-456',
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      await expect(getCollaborators(mockDraftId, mockFirmId)).rejects.toThrow(NotFoundError);
    });
  });
});
