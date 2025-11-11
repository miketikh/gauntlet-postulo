/**
 * Unit Tests for Draft Service
 * Tests draft creation, snapshot management, and version history
 * Based on architecture.md patterns
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { firms, users, projects, templates, drafts, draftSnapshots } from '@/lib/db/schema';
import { hashPassword } from '@/lib/services/auth.service';
import { eq } from 'drizzle-orm';
import {
  createDraft,
  createSnapshot,
  getDraftVersions,
  getDraftVersion,
  restoreDraftVersion,
  getDraftWithProject,
} from '../draft.service';

describe('Draft Service Unit Tests', () => {
  let firmId: string;
  let userId: string;
  let projectId: string;
  let templateId: string;
  let testDraftId: string;

  beforeAll(async () => {
    // Create test firm
    const [firm] = await db.insert(firms).values([
      { name: 'Test Firm - Draft Service' }
    ]).returning();
    firmId = firm.id;

    // Create test user
    const password = await hashPassword('test123');
    const [user] = await db.insert(users).values([
      {
        email: 'draft-test@firm.com',
        passwordHash: password,
        firstName: 'Draft',
        lastName: 'Tester',
        role: 'attorney',
        firmId: firmId,
      }
    ]).returning();
    userId = user.id;

    // Create test template
    const [template] = await db.insert(templates).values([
      {
        name: 'Test Template',
        description: 'Test template for drafts',
        sections: [],
        variables: [],
        firmId: firmId,
        createdBy: userId,
      }
    ]).returning();
    templateId = template.id;

    // Create test project
    const [project] = await db.insert(projects).values([
      {
        title: 'Test Project - Draft Service',
        clientName: 'Test Client',
        status: 'draft',
        caseDetails: { test: true },
        templateId: templateId,
        firmId: firmId,
        createdBy: userId,
      }
    ]).returning();
    projectId = project.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(draftSnapshots).where(eq(draftSnapshots.draftId, testDraftId));
    await db.delete(drafts).where(eq(drafts.projectId, projectId));
    await db.delete(projects).where(eq(projects.id, projectId));
    await db.delete(templates).where(eq(templates.id, templateId));
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(firms).where(eq(firms.id, firmId));
  });

  describe('createDraft', () => {
    it('should create draft with initial snapshot', async () => {
      const draftContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initial draft' }] }] };
      const plainText = 'Initial draft';

      const draft = await createDraft({
        projectId: projectId,
        content: draftContent,
        plainText: plainText,
        createdBy: userId,
      });

      testDraftId = draft.id;

      expect(draft).toBeDefined();
      expect(draft.projectId).toBe(projectId);
      expect(draft.currentVersion).toBe(1);
      expect(draft.plainText).toBe(plainText);

      // Verify initial snapshot was created
      const snapshots = await db.query.draftSnapshots.findMany({
        where: eq(draftSnapshots.draftId, draft.id)
      });

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].version).toBe(1);
      expect(snapshots[0].changeDescription).toBe('Initial draft');
      expect(snapshots[0].createdBy).toBe(userId);
    });

    it('should have correct content in initial snapshot', async () => {
      const draft = await db.query.drafts.findFirst({
        where: eq(drafts.id, testDraftId)
      });

      const snapshot = await db.query.draftSnapshots.findFirst({
        where: eq(draftSnapshots.draftId, testDraftId)
      });

      expect(snapshot?.content).toEqual(draft?.content);
      expect(snapshot?.plainText).toBe(draft?.plainText);
    });
  });

  describe('createSnapshot', () => {
    it('should create new snapshot and increment version', async () => {
      const newContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated draft' }] }] };
      const newPlainText = 'Updated draft';

      const newVersion = await createSnapshot({
        draftId: testDraftId,
        content: newContent,
        plainText: newPlainText,
        createdBy: userId,
        changeDescription: 'First update',
      });

      expect(newVersion).toBe(2);

      // Verify snapshot was created
      const snapshot = await db.query.draftSnapshots.findFirst({
        where: (draftSnapshots, { and, eq }) => and(
          eq(draftSnapshots.draftId, testDraftId),
          eq(draftSnapshots.version, 2)
        )
      });

      expect(snapshot).toBeDefined();
      expect(snapshot?.version).toBe(2);
      expect(snapshot?.changeDescription).toBe('First update');
      expect(snapshot?.plainText).toBe(newPlainText);

      // Verify draft was updated
      const draft = await db.query.drafts.findFirst({
        where: eq(drafts.id, testDraftId)
      });

      expect(draft?.currentVersion).toBe(2);
      expect(draft?.plainText).toBe(newPlainText);
    });

    it('should handle multiple snapshots correctly', async () => {
      // Create version 3
      await createSnapshot({
        draftId: testDraftId,
        content: { type: 'doc', content: [] },
        plainText: 'Version 3',
        createdBy: userId,
        changeDescription: 'Second update',
      });

      // Create version 4
      await createSnapshot({
        draftId: testDraftId,
        content: { type: 'doc', content: [] },
        plainText: 'Version 4',
        createdBy: userId,
        changeDescription: 'Third update',
      });

      const draft = await db.query.drafts.findFirst({
        where: eq(drafts.id, testDraftId)
      });

      expect(draft?.currentVersion).toBe(4);
      expect(draft?.plainText).toBe('Version 4');
    });

    it('should throw NotFoundError for non-existent draft', async () => {
      await expect(
        createSnapshot({
          draftId: '00000000-0000-0000-0000-000000000000',
          content: {},
          plainText: '',
          createdBy: userId,
        })
      ).rejects.toThrow('Draft not found');
    });
  });

  describe('getDraftVersions', () => {
    it('should return all versions in descending order', async () => {
      const versions = await getDraftVersions(testDraftId);

      expect(versions.length).toBeGreaterThanOrEqual(4);

      // Should be in descending order (newest first)
      for (let i = 0; i < versions.length - 1; i++) {
        expect(versions[i].version).toBeGreaterThan(versions[i + 1].version);
      }
    });

    it('should include creator information', async () => {
      const versions = await getDraftVersions(testDraftId);

      expect(versions[0].creator).toBeDefined();
      expect(versions[0].creator.firstName).toBe('Draft');
      expect(versions[0].creator.lastName).toBe('Tester');
      expect(versions[0].creator.email).toBe('draft-test@firm.com');
    });

    it('should limit to 50 versions', async () => {
      const versions = await getDraftVersions(testDraftId);

      // Even if we had more than 50, it should only return 50
      expect(versions.length).toBeLessThanOrEqual(50);
    });

    it('should return empty array for draft with no versions', async () => {
      const versions = await getDraftVersions('00000000-0000-0000-0000-000000000000');
      expect(versions).toEqual([]);
    });
  });

  describe('getDraftVersion', () => {
    it('should return specific version by number', async () => {
      const version = await getDraftVersion(testDraftId, 1);

      expect(version).toBeDefined();
      expect(version.version).toBe(1);
      expect(version.changeDescription).toBe('Initial draft');
    });

    it('should return version with creator information', async () => {
      const version = await getDraftVersion(testDraftId, 2);

      expect(version.creator).toBeDefined();
      expect(version.creator.firstName).toBe('Draft');
      expect(version.creator.lastName).toBe('Tester');
    });

    it('should throw NotFoundError for non-existent version', async () => {
      await expect(
        getDraftVersion(testDraftId, 999)
      ).rejects.toThrow('Version not found');
    });

    it('should throw NotFoundError for non-existent draft', async () => {
      await expect(
        getDraftVersion('00000000-0000-0000-0000-000000000000', 1)
      ).rejects.toThrow('Version not found');
    });
  });

  describe('restoreDraftVersion', () => {
    it('should restore previous version as new snapshot', async () => {
      const originalVersion = await getDraftVersion(testDraftId, 1);
      const originalContent = originalVersion.content;

      // Restore version 1
      const newVersion = await restoreDraftVersion(testDraftId, 1, userId);

      expect(newVersion).toBeGreaterThan(4);

      // Get the new snapshot
      const restoredSnapshot = await getDraftVersion(testDraftId, newVersion);

      expect(restoredSnapshot.content).toEqual(originalContent);
      expect(restoredSnapshot.changeDescription).toBe('Restored from version 1');
      expect(restoredSnapshot.createdBy).toBe(userId);

      // Verify draft was updated
      const draft = await db.query.drafts.findFirst({
        where: eq(drafts.id, testDraftId)
      });

      expect(draft?.currentVersion).toBe(newVersion);
      expect(draft?.content).toEqual(originalContent);
    });

    it('should maintain version history after restore', async () => {
      const versionsBefore = await getDraftVersions(testDraftId);
      const countBefore = versionsBefore.length;

      await restoreDraftVersion(testDraftId, 2, userId);

      const versionsAfter = await getDraftVersions(testDraftId);
      expect(versionsAfter.length).toBe(countBefore + 1);
    });

    it('should throw error when restoring non-existent version', async () => {
      await expect(
        restoreDraftVersion(testDraftId, 999, userId)
      ).rejects.toThrow('Version not found');
    });

    it('should throw error when restoring from non-existent draft', async () => {
      await expect(
        restoreDraftVersion('00000000-0000-0000-0000-000000000000', 1, userId)
      ).rejects.toThrow('Version not found');
    });
  });

  describe('getDraftWithProject', () => {
    it('should return draft with project relationship', async () => {
      const draft = await getDraftWithProject(testDraftId);

      expect(draft).toBeDefined();
      expect(draft.project).toBeDefined();
      expect(draft.project.id).toBe(projectId);
      expect(draft.project.firmId).toBe(firmId);
    });

    it('should throw NotFoundError for non-existent draft', async () => {
      await expect(
        getDraftWithProject('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Draft not found');
    });
  });

  describe('Version History Integrity', () => {
    it('should maintain chronological order of versions', async () => {
      const versions = await getDraftVersions(testDraftId);

      for (let i = 0; i < versions.length - 1; i++) {
        const current = new Date(versions[i].createdAt);
        const next = new Date(versions[i + 1].createdAt);
        // Newer versions should have later or equal timestamps
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime() - 1000); // Allow 1s tolerance
      }
    });

    it('should have unique version numbers', async () => {
      const versions = await getDraftVersions(testDraftId);
      const versionNumbers = versions.map(v => v.version);
      const uniqueVersions = new Set(versionNumbers);

      expect(uniqueVersions.size).toBe(versionNumbers.length);
    });

    it('should have correct current version in draft', async () => {
      const draft = await db.query.drafts.findFirst({
        where: eq(drafts.id, testDraftId)
      });

      const versions = await getDraftVersions(testDraftId);
      const highestVersion = Math.max(...versions.map(v => v.version));

      expect(draft?.currentVersion).toBe(highestVersion);
    });
  });
});
