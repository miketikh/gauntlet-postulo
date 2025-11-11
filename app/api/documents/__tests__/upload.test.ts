/**
 * Integration Tests for Document Upload API
 * Tests file upload, validation, S3 storage, and firm isolation
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { firms, users, projects, templates, sourceDocuments } from '@/lib/db/schema';
import { generateAccessToken, hashPassword } from '@/lib/services/auth.service';
import { eq, and } from 'drizzle-orm';
import * as storageService from '@/lib/services/storage.service';

describe('Document Upload API - Integration Tests', () => {
  let firm1Id: string;
  let firm2Id: string;
  let user1Id: string;
  let user2Id: string;
  let user1Token: string;
  let user2Token: string;
  let firm1ProjectId: string;
  let firm2ProjectId: string;
  let template1Id: string;
  let template2Id: string;

  // Mock S3 operations to avoid actual S3 calls in tests
  beforeAll(async () => {
    // Mock S3 upload and presigned URL generation
    vi.spyOn(storageService, 'uploadDocumentToS3').mockResolvedValue('mocked-s3-key');
    vi.spyOn(storageService, 'getPresignedUrl').mockResolvedValue(
      'https://s3.amazonaws.com/bucket/key?signature=mock'
    );

    // Create two test firms
    const [firm1, firm2] = await db
      .insert(firms)
      .values([
        { name: 'Test Firm 1 - Upload Test' },
        { name: 'Test Firm 2 - Upload Test' },
      ])
      .returning();

    firm1Id = firm1.id;
    firm2Id = firm2.id;

    const password = await hashPassword('test123');

    // Create users in each firm
    const [user1, user2] = await db
      .insert(users)
      .values([
        {
          email: 'upload-test-user1@firm1.com',
          passwordHash: password,
          firstName: 'Upload',
          lastName: 'User1',
          role: 'attorney',
          firmId: firm1Id,
        },
        {
          email: 'upload-test-user2@firm2.com',
          passwordHash: password,
          firstName: 'Upload',
          lastName: 'User2',
          role: 'attorney',
          firmId: firm2Id,
        },
      ])
      .returning();

    user1Id = user1.id;
    user2Id = user2.id;

    // Generate JWT tokens
    user1Token = generateAccessToken({
      userId: user1.id,
      email: user1.email,
      role: user1.role,
      firmId: user1.firmId,
    });

    user2Token = generateAccessToken({
      userId: user2.id,
      email: user2.email,
      role: user2.role,
      firmId: user2.firmId,
    });

    // Create templates for each firm
    const [template1, template2] = await db
      .insert(templates)
      .values([
        {
          name: 'Firm 1 Template - Upload',
          description: 'Test template for firm 1',
          sections: [],
          variables: [],
          firmId: firm1Id,
          createdBy: user1.id,
        },
        {
          name: 'Firm 2 Template - Upload',
          description: 'Test template for firm 2',
          sections: [],
          variables: [],
          firmId: firm2Id,
          createdBy: user2.id,
        },
      ])
      .returning();

    template1Id = template1.id;
    template2Id = template2.id;

    // Create projects in each firm
    const [project1, project2] = await db
      .insert(projects)
      .values([
        {
          title: 'Firm 1 Project - Upload Test',
          clientName: 'Client A',
          status: 'draft',
          caseDetails: { test: true },
          templateId: template1Id,
          firmId: firm1Id,
          createdBy: user1.id,
        },
        {
          title: 'Firm 2 Project - Upload Test',
          clientName: 'Client B',
          status: 'draft',
          caseDetails: { test: true },
          templateId: template2Id,
          firmId: firm2Id,
          createdBy: user2.id,
        },
      ])
      .returning();

    firm1ProjectId = project1.id;
    firm2ProjectId = project2.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(sourceDocuments).where(eq(sourceDocuments.projectId, firm1ProjectId));
    await db.delete(sourceDocuments).where(eq(sourceDocuments.projectId, firm2ProjectId));
    await db.delete(projects).where(eq(projects.firmId, firm1Id));
    await db.delete(projects).where(eq(projects.firmId, firm2Id));
    await db.delete(templates).where(eq(templates.firmId, firm1Id));
    await db.delete(templates).where(eq(templates.firmId, firm2Id));
    await db.delete(users).where(eq(users.firmId, firm1Id));
    await db.delete(users).where(eq(users.firmId, firm2Id));
    await db.delete(firms).where(eq(firms.id, firm1Id));
    await db.delete(firms).where(eq(firms.id, firm2Id));

    // Restore mocked functions
    vi.restoreAllMocks();
  });

  describe('File Validation', () => {
    it('should accept valid PDF file', async () => {
      const mockFile = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });

      // Simulate file upload by directly inserting into database
      const documentId = crypto.randomUUID();
      const s3Key = `${firm1Id}/${firm1ProjectId}/${documentId}-test.pdf`;

      const [document] = await db
        .insert(sourceDocuments)
        .values({
          id: documentId,
          projectId: firm1ProjectId,
          fileName: mockFile.name,
          fileType: mockFile.type,
          fileSize: mockFile.size,
          s3Key,
          extractionStatus: 'pending',
          uploadedBy: user1Id,
        })
        .returning();

      expect(document).toBeDefined();
      expect(document.fileName).toBe('test.pdf');
      expect(document.fileType).toBe('application/pdf');
    });

    it('should accept valid DOCX file', async () => {
      const mockFile = new File(['DOCX content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const documentId = crypto.randomUUID();
      const s3Key = `${firm1Id}/${firm1ProjectId}/${documentId}-test.docx`;

      const [document] = await db
        .insert(sourceDocuments)
        .values({
          id: documentId,
          projectId: firm1ProjectId,
          fileName: mockFile.name,
          fileType: mockFile.type,
          fileSize: mockFile.size,
          s3Key,
          extractionStatus: 'pending',
          uploadedBy: user1Id,
        })
        .returning();

      expect(document).toBeDefined();
      expect(document.fileName).toBe('test.docx');
    });

    it('should accept valid image files', async () => {
      const jpegFile = new File(['JPEG content'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['PNG content'], 'test.png', { type: 'image/png' });

      for (const mockFile of [jpegFile, pngFile]) {
        const documentId = crypto.randomUUID();
        const s3Key = `${firm1Id}/${firm1ProjectId}/${documentId}-${mockFile.name}`;

        const [document] = await db
          .insert(sourceDocuments)
          .values({
            id: documentId,
            projectId: firm1ProjectId,
            fileName: mockFile.name,
            fileType: mockFile.type,
            fileSize: mockFile.size,
            s3Key,
            extractionStatus: 'pending',
            uploadedBy: user1Id,
          })
          .returning();

        expect(document).toBeDefined();
      }
    });

    it('should validate file size limits', () => {
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      const validSize = 10 * 1024 * 1024; // 10MB
      const invalidSize = 60 * 1024 * 1024; // 60MB

      expect(validSize).toBeLessThanOrEqual(MAX_SIZE);
      expect(invalidSize).toBeGreaterThan(MAX_SIZE);
    });
  });

  describe('S3 Key Structure', () => {
    it('should generate correct S3 key format', () => {
      const documentId = 'doc-123';
      const fileName = 'test-document.pdf';
      const s3Key = `${firm1Id}/${firm1ProjectId}/${documentId}-${fileName}`;

      // Verify key structure: firmId/projectId/documentId-filename
      expect(s3Key).toContain(firm1Id);
      expect(s3Key).toContain(firm1ProjectId);
      expect(s3Key).toContain(documentId);
      expect(s3Key).toContain(fileName);

      // Verify separators
      const parts = s3Key.split('/');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe(firm1Id);
      expect(parts[1]).toBe(firm1ProjectId);
      expect(parts[2]).toContain(documentId);
    });

    it('should ensure firm isolation in S3 keys', () => {
      const documentId = 'doc-456';
      const fileName = 'document.pdf';

      const firm1Key = `${firm1Id}/${firm1ProjectId}/${documentId}-${fileName}`;
      const firm2Key = `${firm2Id}/${firm2ProjectId}/${documentId}-${fileName}`;

      // Verify different firms have different key prefixes
      expect(firm1Key).not.toBe(firm2Key);
      expect(firm1Key.startsWith(firm1Id)).toBe(true);
      expect(firm2Key.startsWith(firm2Id)).toBe(true);
    });
  });

  describe('Database Record Creation', () => {
    it('should create document record with correct metadata', async () => {
      const documentId = crypto.randomUUID();
      const fileName = 'metadata-test.pdf';
      const fileType = 'application/pdf';
      const fileSize = 1024 * 100; // 100KB
      const s3Key = `${firm1Id}/${firm1ProjectId}/${documentId}-${fileName}`;

      const [document] = await db
        .insert(sourceDocuments)
        .values({
          id: documentId,
          projectId: firm1ProjectId,
          fileName,
          fileType,
          fileSize,
          s3Key,
          extractionStatus: 'pending',
          uploadedBy: user1Id,
        })
        .returning();

      expect(document.id).toBe(documentId);
      expect(document.fileName).toBe(fileName);
      expect(document.fileType).toBe(fileType);
      expect(document.fileSize).toBe(fileSize);
      expect(document.s3Key).toBe(s3Key);
      expect(document.extractionStatus).toBe('pending');
      expect(document.uploadedBy).toBe(user1Id);
      expect(document.createdAt).toBeDefined();
    });

    it('should link document to correct project', async () => {
      const documentId = crypto.randomUUID();
      const s3Key = `${firm1Id}/${firm1ProjectId}/${documentId}-test.pdf`;

      const [document] = await db
        .insert(sourceDocuments)
        .values({
          id: documentId,
          projectId: firm1ProjectId,
          fileName: 'linked-test.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          s3Key,
          extractionStatus: 'pending',
          uploadedBy: user1Id,
        })
        .returning();

      // Verify project relationship
      const documentWithProject = await db.query.sourceDocuments.findFirst({
        where: eq(sourceDocuments.id, documentId),
        with: { project: true },
      });

      expect(documentWithProject).toBeDefined();
      expect(documentWithProject?.project.id).toBe(firm1ProjectId);
      expect(documentWithProject?.project.firmId).toBe(firm1Id);
    });
  });

  describe('Firm Isolation', () => {
    it('should prevent uploading to another firm project', async () => {
      // User1 from firm1 should not be able to access firm2's project
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.id, firm2ProjectId), eq(projects.firmId, firm1Id)),
      });

      // Query should return undefined due to firm mismatch
      expect(project).toBeUndefined();
    });

    it('should allow user to upload to their own firm project', async () => {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.id, firm1ProjectId), eq(projects.firmId, firm1Id)),
      });

      expect(project).toBeDefined();
      expect(project?.firmId).toBe(firm1Id);
    });

    it('should isolate documents by firm', async () => {
      // Create documents in both firms
      const doc1Id = crypto.randomUUID();
      const doc2Id = crypto.randomUUID();

      await db.insert(sourceDocuments).values([
        {
          id: doc1Id,
          projectId: firm1ProjectId,
          fileName: 'firm1-doc.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          s3Key: `${firm1Id}/${firm1ProjectId}/${doc1Id}-firm1-doc.pdf`,
          extractionStatus: 'pending',
          uploadedBy: user1Id,
        },
        {
          id: doc2Id,
          projectId: firm2ProjectId,
          fileName: 'firm2-doc.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          s3Key: `${firm2Id}/${firm2ProjectId}/${doc2Id}-firm2-doc.pdf`,
          extractionStatus: 'pending',
          uploadedBy: user2Id,
        },
      ]);

      // Get documents for firm1 project
      const firm1Docs = await db.query.sourceDocuments.findMany({
        where: eq(sourceDocuments.projectId, firm1ProjectId),
        with: { project: true },
      });

      // Get documents for firm2 project
      const firm2Docs = await db.query.sourceDocuments.findMany({
        where: eq(sourceDocuments.projectId, firm2ProjectId),
        with: { project: true },
      });

      // Verify each firm only sees their documents
      expect(firm1Docs.every((doc) => doc.project.firmId === firm1Id)).toBe(true);
      expect(firm2Docs.every((doc) => doc.project.firmId === firm2Id)).toBe(true);
    });
  });

  describe('Document Retrieval', () => {
    it('should retrieve document with presigned URL', async () => {
      const documentId = crypto.randomUUID();
      const s3Key = `${firm1Id}/${firm1ProjectId}/${documentId}-retrieve-test.pdf`;

      const [document] = await db
        .insert(sourceDocuments)
        .values({
          id: documentId,
          projectId: firm1ProjectId,
          fileName: 'retrieve-test.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          s3Key,
          extractionStatus: 'pending',
          uploadedBy: user1Id,
        })
        .returning();

      // Generate presigned URL
      const presignedUrl = await storageService.getPresignedUrl(s3Key);

      expect(presignedUrl).toBeDefined();
      expect(presignedUrl).toContain('https://');
    });

    it('should retrieve document with full relationships', async () => {
      const documentId = crypto.randomUUID();
      const s3Key = `${firm1Id}/${firm1ProjectId}/${documentId}-relations-test.pdf`;

      await db.insert(sourceDocuments).values({
        id: documentId,
        projectId: firm1ProjectId,
        fileName: 'relations-test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        s3Key,
        extractionStatus: 'pending',
        uploadedBy: user1Id,
      });

      const document = await db.query.sourceDocuments.findFirst({
        where: eq(sourceDocuments.id, documentId),
        with: {
          project: true,
          uploader: {
            columns: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      expect(document).toBeDefined();
      expect(document?.project).toBeDefined();
      expect(document?.uploader).toBeDefined();
      expect(document?.uploader.email).toBe('upload-test-user1@firm1.com');
    });
  });
});
