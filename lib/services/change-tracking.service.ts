/**
 * Change Tracking Service
 * Tracks document changes and contributors for automatic snapshot creation
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 */

import * as Y from 'yjs';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger';

/**
 * Contributor information for a snapshot
 */
export interface Contributor {
  userId: string;
  name: string;
  changesCount: number;
}

/**
 * Change tracking data for a draft
 */
interface DraftChangeTracking {
  draftId: string;
  contributors: Map<string, number>; // userId -> changesCount
  totalChanges: number;
  lastSnapshotTime: number;
  lastSnapshotCharCount: number;
}

/**
 * Change Tracking Manager
 * Tracks changes in memory for each draft to determine when to create snapshots
 */
class ChangeTrackingManager {
  private tracking: Map<string, DraftChangeTracking> = new Map();

  // Snapshot thresholds
  private readonly SNAPSHOT_TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private readonly SNAPSHOT_CHAR_THRESHOLD = 100; // 100 characters changed

  /**
   * Initialize tracking for a draft
   */
  initializeTracking(draftId: string): void {
    if (!this.tracking.has(draftId)) {
      this.tracking.set(draftId, {
        draftId,
        contributors: new Map(),
        totalChanges: 0,
        lastSnapshotTime: Date.now(),
        lastSnapshotCharCount: 0,
      });

      logger.info('Initialized change tracking for draft', {
        action: 'change_tracking.initialize',
        draftId,
      });
    }
  }

  /**
   * Record a change made by a user
   */
  recordChange(draftId: string, userId: string, changeSize: number): void {
    this.initializeTracking(draftId);

    const tracking = this.tracking.get(draftId)!;

    // Update contributor change count
    const currentCount = tracking.contributors.get(userId) || 0;
    tracking.contributors.set(userId, currentCount + changeSize);

    // Update total changes
    tracking.totalChanges += changeSize;

    logger.debug('Recorded change', {
      action: 'change_tracking.record',
      draftId,
      userId,
      changeSize,
      totalChanges: tracking.totalChanges,
      contributorCount: tracking.contributors.size,
    });
  }

  /**
   * Check if snapshot should be created based on thresholds
   */
  shouldCreateSnapshot(draftId: string): boolean {
    const tracking = this.tracking.get(draftId);
    if (!tracking) {
      return false;
    }

    const timeSinceLastSnapshot = Date.now() - tracking.lastSnapshotTime;
    const changesSinceLastSnapshot = tracking.totalChanges - tracking.lastSnapshotCharCount;

    // Check time threshold (5 minutes)
    if (timeSinceLastSnapshot >= this.SNAPSHOT_TIME_THRESHOLD && changesSinceLastSnapshot > 0) {
      logger.info('Snapshot threshold met (time)', {
        action: 'change_tracking.threshold_met',
        draftId,
        timeSinceLastSnapshot,
        changesSinceLastSnapshot,
        threshold: 'time',
      });
      return true;
    }

    // Check character change threshold (100+ characters)
    if (changesSinceLastSnapshot >= this.SNAPSHOT_CHAR_THRESHOLD) {
      logger.info('Snapshot threshold met (changes)', {
        action: 'change_tracking.threshold_met',
        draftId,
        timeSinceLastSnapshot,
        changesSinceLastSnapshot,
        threshold: 'changes',
      });
      return true;
    }

    return false;
  }

  /**
   * Get contributors for snapshot and reset tracking
   */
  async getContributorsAndReset(draftId: string): Promise<Contributor[]> {
    const tracking = this.tracking.get(draftId);
    if (!tracking || tracking.contributors.size === 0) {
      return [];
    }

    // Get user information from database
    const userIds = Array.from(tracking.contributors.keys());
    const userRecords = await db.query.users.findMany({
      where: inArray(users.id, userIds),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Build contributors array
    const contributors: Contributor[] = userRecords.map((user) => ({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      changesCount: tracking.contributors.get(user.id) || 0,
    }));

    // Sort by changes count (descending)
    contributors.sort((a, b) => b.changesCount - a.changesCount);

    // Reset tracking for next snapshot
    tracking.contributors.clear();
    tracking.lastSnapshotTime = Date.now();
    tracking.lastSnapshotCharCount = tracking.totalChanges;

    logger.info('Retrieved contributors and reset tracking', {
      action: 'change_tracking.reset',
      draftId,
      contributorCount: contributors.length,
      totalChanges: tracking.totalChanges,
    });

    return contributors;
  }

  /**
   * Get current tracking state (for debugging)
   */
  getTrackingState(draftId: string): DraftChangeTracking | null {
    return this.tracking.get(draftId) || null;
  }

  /**
   * Clean up tracking for a draft (when all users disconnect)
   */
  cleanupTracking(draftId: string): void {
    this.tracking.delete(draftId);

    logger.info('Cleaned up change tracking for draft', {
      action: 'change_tracking.cleanup',
      draftId,
    });
  }

  /**
   * Get all tracked drafts (for monitoring)
   */
  getTrackedDrafts(): string[] {
    return Array.from(this.tracking.keys());
  }
}

// Singleton instance
export const changeTrackingManager = new ChangeTrackingManager();

/**
 * Calculate change size from Yjs update
 * Approximates the number of characters changed
 */
export function calculateChangeSize(update: Uint8Array): number {
  // For simplicity, we'll use the update size as an approximation
  // In a more sophisticated implementation, you could decode the update
  // and count actual inserted/deleted characters
  return update.length;
}

/**
 * Extract user ID from Yjs update origin
 * The origin should be set to userId when making changes
 */
export function extractUserIdFromOrigin(origin: any): string | null {
  if (typeof origin === 'string') {
    return origin;
  }

  if (origin && typeof origin === 'object' && origin.userId) {
    return origin.userId;
  }

  return null;
}
