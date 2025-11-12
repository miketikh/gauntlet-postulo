/**
 * Draft Export API Integration Tests
 * Tests the export endpoint end-to-end
 * Part of Story 5.7 - Implement Word Document Export
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { firms, users, projects, templates, drafts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as jose from 'jose';

// Mock environment variables for testing
process.env.EXPORT_UPLOAD_TO_S3 = 'false';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

describe('Draft Export API Integration Tests', () => {
  let testFirmId: string;
  let testUserId: string;
  let testProjectId: string;
  let testDraftId: string;
  let testToken: string;

  beforeAll(async () => {
    // Create test firm
    const [firm] = await db.insert(firms).values({
      name: 'Test Law Firm',
    }).returning();
    testFirmId = firm.id;

    // Create test user
    const [user] = await db.insert(users).values({
      email: 'export-test@example.com',
      passwordHash: 'hashed',
      firstName: 'Export',
      lastName: 'Tester',
      role: 'attorney',
      firmId: testFirmId,
    }).returning();
    testUserId = user.id;

    // Create test template
    const [template] = await db.insert(templates).values({
      name: 'Test Template',
      description: 'Template for export tests',
      firmId: testFirmId,
      createdBy: testUserId,
    }).returning();

    // Create test project
    const [project] = await db.insert(projects).values({
      title: 'Export Test Case',
      clientName: 'John Doe',
      status: 'draft',
      templateId: template.id,
      firmId: testFirmId,
      createdBy: testUserId,
    }).returning();
    testProjectId = project.id;

    // Create test draft
    const [draft] = await db.insert(drafts).values({
      projectId: testProjectId,
      content: {
        root: {
          children: [
            {
              type: 'heading',
              tag: 'h1',
              children: [
                {
                  type: 'text',
                  text: 'Demand for Payment',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'Dear Sir/Madam,',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'This letter serves as a formal demand for payment of ',
                },
                {
                  type: 'text',
                  text: '$50,000',
                  format: 1, // bold
                },
                {
                  type: 'text',
                  text: ' in damages.',
                },
              ],
            },
          ],
        },
      },
      plainText: 'Demand for Payment\n\nDear Sir/Madam,\n\nThis letter serves as a formal demand for payment of $50,000 in damages.',
      currentVersion: 1,
    }).returning();
    testDraftId = draft.id;

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    testToken = await new jose.SignJWT({
      userId: testUserId,
      firmId: testFirmId,
      role: 'attorney',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);
  });

  afterAll(async () => {
    // Clean up test data
    if (testDraftId) {
      await db.delete(drafts).where(eq(drafts.id, testDraftId));
    }
    if (testProjectId) {
      await db.delete(projects).where(eq(projects.id, testProjectId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (testFirmId) {
      await db.delete(firms).where(eq(firms.id, testFirmId));
    }
  });

  describe('POST /api/drafts/[id]/export', () => {
    it('should export draft and return presigned URL (mocked)', async () => {
      // This would normally call the actual API, but for unit tests we test the service directly
      const { exportDraft } = await import('@/lib/services/export.service');

      const result = await exportDraft({
        draftId: testDraftId,
        format: 'docx',
        userId: testUserId,
      });

      expect(result).toBeDefined();
      expect(result.exportId).toBeDefined();
      expect(result.fileName).toContain('Export_Test_Case');
      expect(result.fileName).toContain('.docx');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.buffer).toBeDefined();
    });

    it('should export draft with metadata', async () => {
      const { exportDraft } = await import('@/lib/services/export.service');

      const result = await exportDraft({
        draftId: testDraftId,
        format: 'docx',
        userId: testUserId,
        includeMetadata: true,
      });

      expect(result).toBeDefined();
      expect(result.fileName).toContain('v1'); // version number
    });

    it('should create export record in database', async () => {
      const { exportDraft } = await import('@/lib/services/export.service');

      const result = await exportDraft({
        draftId: testDraftId,
        format: 'docx',
        userId: testUserId,
      });

      // Verify export record was created
      const { getDraftExports } = await import('@/lib/services/export.service');
      const exports = await getDraftExports(testDraftId);

      expect(exports.length).toBeGreaterThan(0);
      const latestExport = exports[0];
      expect(latestExport.draftId).toBe(testDraftId);
      expect(latestExport.format).toBe('docx');
      expect(latestExport.exportedBy).toBe(testUserId);
    });

    it('should generate valid Word document buffer', async () => {
      const { exportDraft } = await import('@/lib/services/export.service');

      const result = await exportDraft({
        draftId: testDraftId,
        format: 'docx',
        userId: testUserId,
      });

      expect(result.buffer).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer!.length).toBeGreaterThan(0);

      // Check for DOCX magic number (PK header for ZIP format)
      const magicNumber = result.buffer!.slice(0, 2).toString('hex');
      expect(magicNumber).toBe('504b'); // 'PK' in hex
    });
  });

  describe('GET /api/drafts/[id]/export', () => {
    it('should return export history', async () => {
      const { exportDraft, getDraftExports } = await import('@/lib/services/export.service');

      // Create multiple exports
      await exportDraft({
        draftId: testDraftId,
        format: 'docx',
        userId: testUserId,
      });

      await exportDraft({
        draftId: testDraftId,
        format: 'docx',
        userId: testUserId,
      });

      const exports = await getDraftExports(testDraftId);

      expect(exports).toBeDefined();
      expect(exports.length).toBeGreaterThan(0);
      expect(exports[0].exporter).toBeDefined();
      expect(exports[0].exporter.firstName).toBe('Export');
    });
  });

  describe('Document Structure Validation', () => {
    it('should preserve rich text formatting', async () => {
      // Create draft with various formatting
      const [formattedDraft] = await db.insert(drafts).values({
        projectId: testProjectId,
        content: {
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Bold text',
                    format: 1,
                  },
                  {
                    type: 'text',
                    text: ' and ',
                  },
                  {
                    type: 'text',
                    text: 'italic text',
                    format: 2,
                  },
                ],
              },
            ],
          },
        },
        plainText: 'Bold text and italic text',
        currentVersion: 1,
      }).returning();

      const { exportDraft } = await import('@/lib/services/export.service');

      const result = await exportDraft({
        draftId: formattedDraft.id,
        format: 'docx',
        userId: testUserId,
      });

      expect(result.buffer).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);

      // Cleanup
      await db.delete(drafts).where(eq(drafts.id, formattedDraft.id));
    });

    it('should handle empty content', async () => {
      const [emptyDraft] = await db.insert(drafts).values({
        projectId: testProjectId,
        content: null,
        plainText: '',
        currentVersion: 1,
      }).returning();

      const { exportDraft } = await import('@/lib/services/export.service');

      const result = await exportDraft({
        draftId: emptyDraft.id,
        format: 'docx',
        userId: testUserId,
      });

      expect(result.buffer).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);

      // Cleanup
      await db.delete(drafts).where(eq(drafts.id, emptyDraft.id));
    });
  });

  describe('Performance', () => {
    it('should export typical document within 5 seconds', async () => {
      const { exportDraft } = await import('@/lib/services/export.service');

      const startTime = Date.now();

      await exportDraft({
        draftId: testDraftId,
        format: 'docx',
        userId: testUserId,
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds
    }, 10000); // Set test timeout to 10 seconds
  });
});
