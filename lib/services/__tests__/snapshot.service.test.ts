/**
 * Snapshot Service Unit Tests
 * Tests for automatic snapshot creation with contributor tracking
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Y from 'yjs';

// Mock dependencies
vi.mock('../db/client', () => ({
  db: {
    query: {
      drafts: {
        findFirst: vi.fn(),
      },
      draftSnapshots: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock('../yjs.service', () => ({
  loadYjsDocumentState: vi.fn(),
  extractPlainTextFromYjs: vi.fn(),
}));

vi.mock('./change-tracking.service', () => ({
  changeTrackingManager: {
    getContributorsAndReset: vi.fn(),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

import { db } from '../db/client';
import { loadYjsDocumentState, extractPlainTextFromYjs } from '../yjs.service';
import { changeTrackingManager } from './change-tracking.service';
import {
  createSnapshotFromTracking,
  createManualSnapshot,
  getSnapshotHistory,
  compareSnapshots,
} from '../snapshot.service';

describe('Snapshot Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSnapshotFromTracking', () => {
    it('should create snapshot with contributors', async () => {
      // Mock draft
      const mockDraft = {
        id: 'draft-1',
        currentVersion: 5,
        projectId: 'project-1',
      };

      // Mock Yjs document
      const mockYdoc = new Y.Doc();
      mockYdoc.getText('root').insert(0, 'Test content');

      // Mock contributors
      const mockContributors = [
        { userId: 'user-1', name: 'John Doe', changesCount: 50 },
        { userId: 'user-2', name: 'Jane Smith', changesCount: 30 },
      ];

      // Setup mocks
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(loadYjsDocumentState).mockResolvedValue(mockYdoc);
      vi.mocked(extractPlainTextFromYjs).mockReturnValue('Test content');
      vi.mocked(changeTrackingManager.getContributorsAndReset).mockResolvedValue(
        mockContributors
      );

      const mockInsert = vi.fn(() => ({
        values: vi.fn(),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      // Create snapshot
      const version = await createSnapshotFromTracking('draft-1', 'user-1');

      // Verify
      expect(version).toBe(6); // currentVersion + 1
      expect(db.query.drafts.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
      });
      expect(loadYjsDocumentState).toHaveBeenCalledWith('draft-1');
      expect(changeTrackingManager.getContributorsAndReset).toHaveBeenCalledWith(
        'draft-1'
      );
      expect(mockInsert).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle draft not found', async () => {
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(null);

      await expect(
        createSnapshotFromTracking('nonexistent', 'user-1')
      ).rejects.toThrow('Draft not found');
    });
  });

  describe('createManualSnapshot', () => {
    it('should create manual snapshot with custom description', async () => {
      const mockDraft = {
        id: 'draft-1',
        currentVersion: 3,
        projectId: 'project-1',
      };

      const mockYdoc = new Y.Doc();
      mockYdoc.getText('root').insert(0, 'Manual snapshot content');

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(loadYjsDocumentState).mockResolvedValue(mockYdoc);
      vi.mocked(extractPlainTextFromYjs).mockReturnValue('Manual snapshot content');
      vi.mocked(changeTrackingManager.getContributorsAndReset).mockResolvedValue([]);

      const mockInsert = vi.fn(() => ({
        values: vi.fn(),
      }));
      vi.mocked(db.insert).mockImplementation(mockInsert as any);

      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(),
        })),
      }));
      vi.mocked(db.update).mockImplementation(mockUpdate as any);

      const version = await createManualSnapshot(
        'draft-1',
        'user-1',
        'Custom description'
      );

      expect(version).toBe(4);
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('getSnapshotHistory', () => {
    it('should return formatted snapshot history', async () => {
      const mockSnapshots = [
        {
          id: 'snapshot-1',
          version: 3,
          createdAt: new Date('2025-01-01'),
          creator: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          changeDescription: 'Test change',
          contributors: [
            { userId: 'user-1', name: 'John Doe', changesCount: 20 },
          ],
          plainText: 'Test content',
        },
      ];

      vi.mocked(db.query.draftSnapshots.findMany).mockResolvedValue(
        mockSnapshots as any
      );

      const history = await getSnapshotHistory('draft-1');

      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        id: 'snapshot-1',
        version: 3,
        createdBy: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        contributors: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            name: 'John Doe',
            changesCount: 20,
          }),
        ]),
      });
    });

    it('should respect limit parameter', async () => {
      vi.mocked(db.query.draftSnapshots.findMany).mockResolvedValue([]);

      await getSnapshotHistory('draft-1', 10);

      expect(db.query.draftSnapshots.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
        })
      );
    });
  });

  describe('compareSnapshots', () => {
    it('should generate diff between versions', async () => {
      const mockSnapshot1 = {
        id: 'snap-1',
        version: 1,
        content: {},
        plainText: 'Line 1\nLine 2\nLine 3',
        createdAt: new Date('2025-01-01'),
        creator: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        changeDescription: 'Version 1',
        contributors: [],
      };

      const mockSnapshot2 = {
        id: 'snap-2',
        version: 2,
        content: {},
        plainText: 'Line 1\nLine 2 modified\nLine 3\nLine 4',
        createdAt: new Date('2025-01-02'),
        creator: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        changeDescription: 'Version 2',
        contributors: [{ userId: 'user-1', name: 'John Doe', changesCount: 15 }],
      };

      vi.mocked(db.query.draftSnapshots.findFirst)
        .mockResolvedValueOnce(mockSnapshot1 as any)
        .mockResolvedValueOnce(mockSnapshot2 as any);

      const diff = await compareSnapshots('draft-1', 1, 2);

      expect(diff.fromVersion).toBe(1);
      expect(diff.toVersion).toBe(2);
      expect(diff.diff).toBeDefined();
      expect(diff.contributorsBetween).toEqual(mockSnapshot2.contributors);
    });
  });
});
