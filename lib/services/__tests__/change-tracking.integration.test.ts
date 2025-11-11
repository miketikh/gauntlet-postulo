/**
 * Change Tracking Integration Tests
 * Tests multi-user collaboration and snapshot creation
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
      users: {
        findMany: vi.fn(),
      },
      draftSnapshots: {
        findMany: vi.fn(),
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
  saveYjsDocumentState: vi.fn(),
  extractPlainTextFromYjs: vi.fn(),
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
import { changeTrackingManager } from '../change-tracking.service';
import { createSnapshotFromTracking } from '../snapshot.service';

describe('Change Tracking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track changes from multiple users and create snapshot', async () => {
    const draftId = 'draft-multi-user';
    const user1Id = 'user-alice';
    const user2Id = 'user-bob';
    const user3Id = 'user-charlie';

    // Mock draft
    const mockDraft = {
      id: draftId,
      currentVersion: 1,
      projectId: 'project-1',
    };

    // Mock Yjs document
    const mockYdoc = new Y.Doc();
    const yText = mockYdoc.getText('root');
    yText.insert(0, 'Collaborative document content');

    // Mock users
    const mockUsers = [
      { id: user1Id, firstName: 'Alice', lastName: 'Anderson' },
      { id: user2Id, firstName: 'Bob', lastName: 'Brown' },
      { id: user3Id, firstName: 'Charlie', lastName: 'Clark' },
    ];

    vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
    vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(loadYjsDocumentState).mockResolvedValue(mockYdoc);
    vi.mocked(extractPlainTextFromYjs).mockReturnValue(
      'Collaborative document content'
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

    // Initialize tracking
    changeTrackingManager.initializeTracking(draftId);

    // Simulate multiple users making edits
    // User 1 makes 50 characters of changes
    changeTrackingManager.recordChange(draftId, user1Id, 50);

    // User 2 makes 30 characters of changes
    changeTrackingManager.recordChange(draftId, user2Id, 30);

    // User 1 makes another 25 characters of changes
    changeTrackingManager.recordChange(draftId, user1Id, 25);

    // User 3 makes 20 characters of changes
    changeTrackingManager.recordChange(draftId, user3Id, 20);

    // Total: 125 characters changed (exceeds 100 character threshold)

    // Verify tracking state
    const state = changeTrackingManager.getTrackingState(draftId);
    expect(state?.contributors.size).toBe(3);
    expect(state?.totalChanges).toBe(125);

    // Verify snapshot should be created
    const shouldCreate = changeTrackingManager.shouldCreateSnapshot(draftId);
    expect(shouldCreate).toBe(true);

    // Create snapshot
    const version = await createSnapshotFromTracking(draftId, user1Id);

    // Verify snapshot was created
    expect(version).toBe(2);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();

    // Verify contributors were tracked correctly
    // The getContributorsAndReset should have been called internally
    expect(db.query.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
      })
    );

    // Verify tracking was reset after snapshot
    const stateAfter = changeTrackingManager.getTrackingState(draftId);
    expect(stateAfter?.contributors.size).toBe(0);

    // Cleanup
    changeTrackingManager.cleanupTracking(draftId);
  });

  it('should create snapshot after time threshold with activity', async () => {
    const draftId = 'draft-time-threshold';
    const userId = 'user-time-test';

    const mockDraft = {
      id: draftId,
      currentVersion: 3,
      projectId: 'project-1',
    };

    const mockYdoc = new Y.Doc();
    mockYdoc.getText('root').insert(0, 'Time threshold test');

    const mockUsers = [
      { id: userId, firstName: 'Test', lastName: 'User' },
    ];

    vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
    vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(loadYjsDocumentState).mockResolvedValue(mockYdoc);
    vi.mocked(extractPlainTextFromYjs).mockReturnValue('Time threshold test');

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

    // Initialize tracking
    changeTrackingManager.initializeTracking(draftId);

    // Make a small change (below character threshold)
    changeTrackingManager.recordChange(draftId, userId, 10);

    // Verify snapshot should NOT be created yet
    let shouldCreate = changeTrackingManager.shouldCreateSnapshot(draftId);
    expect(shouldCreate).toBe(false);

    // Simulate 5 minutes passing
    const state = changeTrackingManager.getTrackingState(draftId);
    state!.lastSnapshotTime = Date.now() - 5 * 60 * 1000 - 1000;

    // Now snapshot should be created
    shouldCreate = changeTrackingManager.shouldCreateSnapshot(draftId);
    expect(shouldCreate).toBe(true);

    // Create snapshot
    const version = await createSnapshotFromTracking(draftId, userId);
    expect(version).toBe(4);

    // Cleanup
    changeTrackingManager.cleanupTracking(draftId);
  });

  it('should handle no contributors gracefully', async () => {
    const draftId = 'draft-no-contributors';
    const userId = 'user-trigger';

    const mockDraft = {
      id: draftId,
      currentVersion: 1,
      projectId: 'project-1',
    };

    const mockYdoc = new Y.Doc();
    mockYdoc.getText('root').insert(0, 'Empty contributors test');

    vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
    vi.mocked(db.query.users.findMany).mockResolvedValue([]);
    vi.mocked(loadYjsDocumentState).mockResolvedValue(mockYdoc);
    vi.mocked(extractPlainTextFromYjs).mockReturnValue('Empty contributors test');

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

    // Initialize tracking without recording any changes
    changeTrackingManager.initializeTracking(draftId);

    // Create snapshot (manually triggered)
    const version = await createSnapshotFromTracking(draftId, userId);

    expect(version).toBe(2);
    expect(mockInsert).toHaveBeenCalled();

    // Cleanup
    changeTrackingManager.cleanupTracking(draftId);
  });
});
