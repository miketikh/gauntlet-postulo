/**
 * Draft Save Integration Tests
 * Tests for draft CRUD operations
 * Part of Story 4.1 - Integrate Rich Text Editor
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { drafts, projects, firms, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as jose from 'jose';

// Mock auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  verifyAuth: vi.fn(async () => ({
    userId: 'test-user-id',
    firmId: 'test-firm-id',
    role: 'attorney',
  })),
}));

describe('Draft API - Save Functionality', () => {
  let testFirmId: string;
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Create test firm
    const [firm] = await db
      .insert(firms)
      .values({
        name: 'Test Firm for Draft Tests',
      })
      .returning();
    testFirmId = firm.id;

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'draft-test@example.com',
        passwordHash: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: 'attorney',
        firmId: testFirmId,
      })
      .returning();
    testUserId = user.id;

    // Create test project
    const [project] = await db
      .insert(projects)
      .values({
        title: 'Test Project for Drafts',
        clientName: 'Test Client',
        status: 'draft',
        templateId: 'template-id', // Assume template exists
        firmId: testFirmId,
        createdBy: testUserId,
      })
      .returning();
    testProjectId = project.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testProjectId) {
      await db.delete(drafts).where(eq(drafts.projectId, testProjectId));
      await db.delete(projects).where(eq(projects.id, testProjectId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (testFirmId) {
      await db.delete(firms).where(eq(firms.id, testFirmId));
    }
  });

  it('creates a new draft', async () => {
    const draftContent = {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Test draft content',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };

    const [draft] = await db
      .insert(drafts)
      .values({
        projectId: testProjectId,
        content: draftContent,
      })
      .returning();

    expect(draft).toBeDefined();
    expect(draft.projectId).toBe(testProjectId);
    expect(draft.content).toEqual(draftContent);
    expect(draft.currentVersion).toBe(1);
  });

  it('retrieves an existing draft', async () => {
    const existingDraft = await db.query.drafts.findFirst({
      where: eq(drafts.projectId, testProjectId),
    });

    expect(existingDraft).toBeDefined();
    expect(existingDraft?.projectId).toBe(testProjectId);
  });

  it('updates draft content', async () => {
    const updatedContent = {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 1, // Bold
                mode: 'normal',
                style: '',
                text: 'Updated draft content',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };

    const existingDraft = await db.query.drafts.findFirst({
      where: eq(drafts.projectId, testProjectId),
    });

    if (existingDraft) {
      const [updatedDraft] = await db
        .update(drafts)
        .set({
          content: updatedContent,
          updatedAt: new Date(),
        })
        .where(eq(drafts.id, existingDraft.id))
        .returning();

      expect(updatedDraft.content).toEqual(updatedContent);
      expect(updatedDraft.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('deletes a draft', async () => {
    const existingDraft = await db.query.drafts.findFirst({
      where: eq(drafts.projectId, testProjectId),
    });

    if (existingDraft) {
      await db.delete(drafts).where(eq(drafts.id, existingDraft.id));

      const deletedDraft = await db.query.drafts.findFirst({
        where: eq(drafts.id, existingDraft.id),
      });

      expect(deletedDraft).toBeUndefined();
    }
  });

  it('auto-save preserves draft content structure', async () => {
    const complexContent = {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 1, // Bold
                mode: 'normal',
                style: '',
                text: 'Bold text',
                type: 'text',
                version: 1,
              },
              {
                detail: 0,
                format: 2, // Italic
                mode: 'normal',
                style: '',
                text: ' italic text',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'List item 1',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'listitem',
            value: 1,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };

    const [draft] = await db
      .insert(drafts)
      .values({
        projectId: testProjectId,
        content: complexContent,
      })
      .returning();

    expect(draft.content).toEqual(complexContent);

    // Verify structure is preserved
    const savedDraft = await db.query.drafts.findFirst({
      where: eq(drafts.id, draft.id),
    });

    expect(savedDraft?.content).toEqual(complexContent);
  });
});
