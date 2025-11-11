/**
 * Change Tracking Service Unit Tests
 * Tests for tracking contributors and determining snapshot thresholds
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      users: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

import { db } from '@/lib/db/client';
import {
  changeTrackingManager,
  calculateChangeSize,
  extractUserIdFromOrigin,
} from '@/lib/services/change-tracking.service';

describe('Change Tracking Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('changeTrackingManager', () => {
    const draftId = 'draft-test-1';
    const userId1 = 'user-1';
    const userId2 = 'user-2';

    afterEach(() => {
      // Clean up tracking after each test
      changeTrackingManager.cleanupTracking(draftId);
    });

    it('should initialize tracking for a draft', () => {
      changeTrackingManager.initializeTracking(draftId);
      const state = changeTrackingManager.getTrackingState(draftId);

      expect(state).toBeDefined();
      expect(state?.draftId).toBe(draftId);
      expect(state?.contributors.size).toBe(0);
      expect(state?.totalChanges).toBe(0);
    });

    it('should record changes from multiple users', () => {
      changeTrackingManager.initializeTracking(draftId);

      changeTrackingManager.recordChange(draftId, userId1, 50);
      changeTrackingManager.recordChange(draftId, userId2, 30);
      changeTrackingManager.recordChange(draftId, userId1, 20);

      const state = changeTrackingManager.getTrackingState(draftId);

      expect(state?.contributors.size).toBe(2);
      expect(state?.contributors.get(userId1)).toBe(70);
      expect(state?.contributors.get(userId2)).toBe(30);
      expect(state?.totalChanges).toBe(100);
    });

    it('should trigger snapshot on time threshold', () => {
      changeTrackingManager.initializeTracking(draftId);
      const state = changeTrackingManager.getTrackingState(draftId);

      // Record a change
      changeTrackingManager.recordChange(draftId, userId1, 10);

      // Mock time passing (5 minutes)
      state!.lastSnapshotTime = Date.now() - 5 * 60 * 1000 - 1000;

      const shouldCreate = changeTrackingManager.shouldCreateSnapshot(draftId);
      expect(shouldCreate).toBe(true);
    });

    it('should trigger snapshot on character threshold', () => {
      changeTrackingManager.initializeTracking(draftId);

      // Record 100+ characters of changes
      changeTrackingManager.recordChange(draftId, userId1, 100);

      const shouldCreate = changeTrackingManager.shouldCreateSnapshot(draftId);
      expect(shouldCreate).toBe(true);
    });

    it('should not trigger snapshot if no changes', () => {
      changeTrackingManager.initializeTracking(draftId);

      const shouldCreate = changeTrackingManager.shouldCreateSnapshot(draftId);
      expect(shouldCreate).toBe(false);
    });

    it('should not trigger snapshot if below thresholds', () => {
      changeTrackingManager.initializeTracking(draftId);

      // Record small change
      changeTrackingManager.recordChange(draftId, userId1, 10);

      const shouldCreate = changeTrackingManager.shouldCreateSnapshot(draftId);
      expect(shouldCreate).toBe(false);
    });

    it('should get contributors and reset tracking', async () => {
      // Mock user data
      const mockUsers = [
        { id: userId1, firstName: 'John', lastName: 'Doe' },
        { id: userId2, firstName: 'Jane', lastName: 'Smith' },
      ];

      vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsers as any);

      changeTrackingManager.initializeTracking(draftId);
      changeTrackingManager.recordChange(draftId, userId1, 70);
      changeTrackingManager.recordChange(draftId, userId2, 30);

      const stateBefore = changeTrackingManager.getTrackingState(draftId);
      const totalChangesBefore = stateBefore?.totalChanges;

      const contributors = await changeTrackingManager.getContributorsAndReset(
        draftId
      );

      expect(contributors).toHaveLength(2);
      expect(contributors[0]).toMatchObject({
        userId: userId1,
        name: 'John Doe',
        changesCount: 70,
      });
      expect(contributors[1]).toMatchObject({
        userId: userId2,
        name: 'Jane Smith',
        changesCount: 30,
      });

      // Verify contributors are sorted by changes count (descending)
      expect(contributors[0].changesCount).toBeGreaterThan(
        contributors[1].changesCount
      );

      // Verify tracking is reset
      const stateAfter = changeTrackingManager.getTrackingState(draftId);
      expect(stateAfter?.contributors.size).toBe(0);
      expect(stateAfter?.lastSnapshotCharCount).toBe(totalChangesBefore);
    });

    it('should cleanup tracking', () => {
      changeTrackingManager.initializeTracking(draftId);
      changeTrackingManager.recordChange(draftId, userId1, 50);

      changeTrackingManager.cleanupTracking(draftId);

      const state = changeTrackingManager.getTrackingState(draftId);
      expect(state).toBeNull();
    });

    it('should track multiple drafts independently', () => {
      const draftId1 = 'draft-1';
      const draftId2 = 'draft-2';

      changeTrackingManager.initializeTracking(draftId1);
      changeTrackingManager.initializeTracking(draftId2);

      changeTrackingManager.recordChange(draftId1, userId1, 50);
      changeTrackingManager.recordChange(draftId2, userId2, 30);

      const state1 = changeTrackingManager.getTrackingState(draftId1);
      const state2 = changeTrackingManager.getTrackingState(draftId2);

      expect(state1?.totalChanges).toBe(50);
      expect(state2?.totalChanges).toBe(30);

      changeTrackingManager.cleanupTracking(draftId1);
      changeTrackingManager.cleanupTracking(draftId2);
    });
  });

  describe('calculateChangeSize', () => {
    it('should calculate change size from Yjs update', () => {
      const update = new Uint8Array([1, 2, 3, 4, 5]);
      const size = calculateChangeSize(update);

      expect(size).toBe(5);
    });

    it('should handle empty updates', () => {
      const update = new Uint8Array([]);
      const size = calculateChangeSize(update);

      expect(size).toBe(0);
    });
  });

  describe('extractUserIdFromOrigin', () => {
    it('should extract userId from string origin', () => {
      const userId = extractUserIdFromOrigin('user-123');

      expect(userId).toBe('user-123');
    });

    it('should extract userId from object origin', () => {
      const userId = extractUserIdFromOrigin({ userId: 'user-456' });

      expect(userId).toBe('user-456');
    });

    it('should return null for invalid origin', () => {
      expect(extractUserIdFromOrigin(null)).toBeNull();
      expect(extractUserIdFromOrigin(undefined)).toBeNull();
      expect(extractUserIdFromOrigin(123)).toBeNull();
      expect(extractUserIdFromOrigin({})).toBeNull();
    });
  });
});
