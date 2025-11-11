/**
 * Draft Service
 * Handles draft creation, snapshot management, and version history
 * Based on architecture.md patterns
 */

import { db } from '../db/client';
import { drafts, draftSnapshots } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NotFoundError } from '../errors';

export interface CreateDraftInput {
  projectId: string;
  content: any;
  plainText: string;
  createdBy: string;
}

export interface CreateSnapshotInput {
  draftId: string;
  content: any;
  plainText: string;
  createdBy: string;
  changeDescription?: string;
}

/**
 * Create new draft for project
 * Creates both draft and initial snapshot (version 1)
 */
export async function createDraft(input: CreateDraftInput) {
  const [draft] = await db.insert(drafts).values({
    projectId: input.projectId,
    content: input.content,
    plainText: input.plainText,
    currentVersion: 1,
  }).returning();

  // Create initial snapshot
  await db.insert(draftSnapshots).values({
    draftId: draft.id,
    version: 1,
    content: input.content,
    plainText: input.plainText,
    createdBy: input.createdBy,
    changeDescription: 'Initial draft',
  });

  return draft;
}

/**
 * Create new snapshot (version)
 * Increments version and updates current draft content
 */
export async function createSnapshot(input: CreateSnapshotInput) {
  // Get current draft
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, input.draftId),
  });

  if (!draft) {
    throw new NotFoundError('Draft not found');
  }

  const newVersion = draft.currentVersion + 1;

  // Create snapshot
  await db.insert(draftSnapshots).values({
    draftId: input.draftId,
    version: newVersion,
    content: input.content,
    plainText: input.plainText,
    createdBy: input.createdBy,
    changeDescription: input.changeDescription || `Version ${newVersion}`,
  });

  // Update draft current version and content
  await db.update(drafts)
    .set({
      currentVersion: newVersion,
      content: input.content,
      plainText: input.plainText,
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, input.draftId));

  return newVersion;
}

/**
 * Get all versions for a draft (limited to last 50)
 * Returns snapshots with creator information
 */
export async function getDraftVersions(draftId: string) {
  const versions = await db.query.draftSnapshots.findMany({
    where: eq(draftSnapshots.draftId, draftId),
    orderBy: [desc(draftSnapshots.version)],
    limit: 50,
    with: {
      creator: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    }
  });

  return versions;
}

/**
 * Get specific version
 * Returns single snapshot by draftId and version number
 */
export async function getDraftVersion(draftId: string, version: number) {
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
        }
      }
    }
  });

  if (!snapshot) {
    throw new NotFoundError('Version not found');
  }

  return snapshot;
}

/**
 * Restore a previous version (creates new snapshot)
 * Loads old version content and creates new snapshot as latest version
 */
export async function restoreDraftVersion(
  draftId: string,
  version: number,
  userId: string
) {
  // Get the version to restore
  const oldVersion = await getDraftVersion(draftId, version);

  // Create new snapshot from old content
  const newVersion = await createSnapshot({
    draftId,
    content: oldVersion.content,
    plainText: oldVersion.plainText,
    createdBy: userId,
    changeDescription: `Restored from version ${version}`,
  });

  return newVersion;
}

/**
 * Get draft by ID with project relationship
 * Used for firm isolation validation
 */
export async function getDraftWithProject(draftId: string) {
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    with: {
      project: true,
    }
  });

  if (!draft) {
    throw new NotFoundError('Draft not found');
  }

  return draft;
}
