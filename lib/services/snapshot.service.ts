/**
 * Snapshot Service
 * Handles automatic snapshot creation with contributor tracking
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 */

import { db } from '../db/client';
import { drafts, draftSnapshots } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { loadYjsDocumentState } from './yjs.service';
import { changeTrackingManager, Contributor } from './change-tracking.service';
import { extractPlainTextFromYjs } from './yjs.service';
import { logger } from '../utils/logger';
import { NotFoundError } from '../errors';
import * as Y from 'yjs';

/**
 * Create snapshot from current tracking data
 * Called automatically when snapshot thresholds are met
 */
export async function createSnapshotFromTracking(
  draftId: string,
  triggeredByUserId: string
): Promise<number> {
  try {
    // Get current draft
    const draft = await db.query.drafts.findFirst({
      where: eq(drafts.id, draftId),
    });

    if (!draft) {
      throw new NotFoundError('Draft not found');
    }

    // Load current Yjs document state
    const ydoc = await loadYjsDocumentState(draftId);

    // Extract plain text
    const plainText = extractPlainTextFromYjs(ydoc);

    // Get contributors and reset tracking
    const contributors = await changeTrackingManager.getContributorsAndReset(draftId);

    // Encode Yjs state as content
    const content = {
      yjsState: Buffer.from(Y.encodeStateAsUpdate(ydoc)).toString('base64'),
    };

    const newVersion = draft.currentVersion + 1;

    // Create snapshot with contributors
    await db.insert(draftSnapshots).values({
      draftId,
      version: newVersion,
      content,
      plainText,
      createdBy: triggeredByUserId,
      changeDescription: `Automatic snapshot (${contributors.length} contributor${contributors.length !== 1 ? 's' : ''})`,
      contributors: contributors,
    });

    // Update draft current version
    await db.update(drafts)
      .set({
        currentVersion: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, draftId));

    logger.info('Created automatic snapshot', {
      action: 'snapshot.create',
      draftId,
      version: newVersion,
      contributorCount: contributors.length,
      contributors: contributors.map((c) => ({ userId: c.userId, changes: c.changesCount })),
      triggeredBy: triggeredByUserId,
    });

    return newVersion;
  } catch (error) {
    logger.error('Failed to create snapshot', {
      action: 'snapshot.create_failed',
      draftId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Create manual snapshot (user-triggered)
 */
export async function createManualSnapshot(
  draftId: string,
  userId: string,
  changeDescription?: string
): Promise<number> {
  try {
    // Get current draft
    const draft = await db.query.drafts.findFirst({
      where: eq(drafts.id, draftId),
    });

    if (!draft) {
      throw new NotFoundError('Draft not found');
    }

    // Load current Yjs document state
    const ydoc = await loadYjsDocumentState(draftId);

    // Extract plain text
    const plainText = extractPlainTextFromYjs(ydoc);

    // Get contributors (may be empty if no tracking yet)
    const contributors = await changeTrackingManager.getContributorsAndReset(draftId);

    // Encode Yjs state as content
    const content = {
      yjsState: Buffer.from(Y.encodeStateAsUpdate(ydoc)).toString('base64'),
    };

    const newVersion = draft.currentVersion + 1;

    // Create snapshot
    await db.insert(draftSnapshots).values({
      draftId,
      version: newVersion,
      content,
      plainText,
      createdBy: userId,
      changeDescription: changeDescription || `Manual snapshot`,
      contributors: contributors,
    });

    // Update draft current version
    await db.update(drafts)
      .set({
        currentVersion: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, draftId));

    logger.info('Created manual snapshot', {
      action: 'snapshot.create_manual',
      draftId,
      version: newVersion,
      contributorCount: contributors.length,
      createdBy: userId,
    });

    return newVersion;
  } catch (error) {
    logger.error('Failed to create manual snapshot', {
      action: 'snapshot.create_manual_failed',
      draftId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get snapshot history with contributors
 */
export async function getSnapshotHistory(draftId: string, limit: number = 50) {
  const snapshots = await db.query.draftSnapshots.findMany({
    where: eq(draftSnapshots.draftId, draftId),
    orderBy: [desc(draftSnapshots.version)],
    limit,
    with: {
      creator: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    version: snapshot.version,
    createdAt: snapshot.createdAt,
    createdBy: {
      id: snapshot.creator.id,
      name: `${snapshot.creator.firstName} ${snapshot.creator.lastName}`,
      email: snapshot.creator.email,
    },
    changeDescription: snapshot.changeDescription,
    contributors: snapshot.contributors as Contributor[] || [],
    plainText: snapshot.plainText,
  }));
}

/**
 * Get specific snapshot with full content
 */
export async function getSnapshot(draftId: string, version: number) {
  const snapshot = await db.query.draftSnapshots.findFirst({
    where: and(
      eq(draftSnapshots.draftId, draftId),
      eq(draftSnapshots.version, version)
    ),
    with: {
      creator: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!snapshot) {
    throw new NotFoundError('Snapshot not found');
  }

  return {
    id: snapshot.id,
    version: snapshot.version,
    content: snapshot.content,
    plainText: snapshot.plainText,
    createdAt: snapshot.createdAt,
    createdBy: {
      id: snapshot.creator.id,
      name: `${snapshot.creator.firstName} ${snapshot.creator.lastName}`,
      email: snapshot.creator.email,
    },
    changeDescription: snapshot.changeDescription,
    contributors: snapshot.contributors as Contributor[] || [],
  };
}

/**
 * Compare two snapshots and generate diff
 */
export async function compareSnapshots(
  draftId: string,
  fromVersion: number,
  toVersion: number
) {
  const [fromSnapshot, toSnapshot] = await Promise.all([
    getSnapshot(draftId, fromVersion),
    getSnapshot(draftId, toVersion),
  ]);

  // Simple text-based diff
  const diff = generateTextDiff(
    fromSnapshot.plainText || '',
    toSnapshot.plainText || ''
  );

  return {
    fromVersion,
    toVersion,
    fromCreatedAt: fromSnapshot.createdAt,
    toCreatedAt: toSnapshot.createdAt,
    diff,
    contributorsBetween: toSnapshot.contributors,
  };
}

/**
 * Generate simple text diff
 * Returns array of {type: 'added' | 'removed' | 'unchanged', text: string}
 */
function generateTextDiff(
  oldText: string,
  newText: string
): Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> {
  // Simple line-by-line diff
  // For production, consider using a library like 'diff' or 'fast-diff'
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const diff: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> = [];

  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // Remaining lines are added
      diff.push({ type: 'added', text: newLines[j] });
      j++;
    } else if (j >= newLines.length) {
      // Remaining lines are removed
      diff.push({ type: 'removed', text: oldLines[i] });
      i++;
    } else if (oldLines[i] === newLines[j]) {
      // Lines match
      diff.push({ type: 'unchanged', text: oldLines[i] });
      i++;
      j++;
    } else {
      // Lines differ - check if it's an addition or removal
      const oldLineInNew = newLines.indexOf(oldLines[i], j);
      const newLineInOld = oldLines.indexOf(newLines[j], i);

      if (oldLineInNew !== -1 && (newLineInOld === -1 || oldLineInNew < newLineInOld)) {
        // Old line appears later in new, so this is an addition
        diff.push({ type: 'added', text: newLines[j] });
        j++;
      } else if (newLineInOld !== -1) {
        // New line appears later in old, so this is a removal
        diff.push({ type: 'removed', text: oldLines[i] });
        i++;
      } else {
        // Lines are different - mark both
        diff.push({ type: 'removed', text: oldLines[i] });
        diff.push({ type: 'added', text: newLines[j] });
        i++;
        j++;
      }
    }
  }

  return diff;
}
