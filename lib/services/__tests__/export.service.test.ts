/**
 * Export Service Tests
 * Unit tests for Word document export functionality
 * Part of Story 5.7 - Implement Word Document Export
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportDraft, getDraftExports } from '../export.service';

// Mock dependencies
vi.mock('../../../lib/db/client', () => ({
  db: {
    query: {
      drafts: {
        findFirst: vi.fn(),
      },
      draftExports: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

vi.mock('../storage.service', () => ({
  uploadFile: vi.fn(),
  getPresignedUrl: vi.fn(),
}));

describe('Export Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variable to skip S3 upload in tests
    process.env.EXPORT_UPLOAD_TO_S3 = 'false';
  });

  describe('exportDraft', () => {
    it('should export draft to Word document', async () => {
      const mockDraft = {
        id: 'draft-123',
        projectId: 'project-123',
        currentVersion: 1,
        content: {
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'This is a test draft',
                  },
                ],
              },
            ],
          },
        },
        plainText: 'This is a test draft',
        project: {
          id: 'project-123',
          firmId: 'firm-123',
          title: 'Test Case',
          clientName: 'John Doe',
          template: {
            id: 'template-123',
            name: 'Standard Demand Letter',
          },
        },
      };

      const { db } = await import('../../../lib/db/client');
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'export-123',
              draftId: 'draft-123',
              version: 1,
              format: 'docx',
              fileName: 'Test_Case_v1_2025-11-11.docx',
              fileSize: 1024,
              createdAt: new Date(),
            },
          ]),
        }),
      } as any);

      const result = await exportDraft({
        draftId: 'draft-123',
        format: 'docx',
        userId: 'user-123',
      });

      expect(result).toBeDefined();
      expect(result.exportId).toBe('export-123');
      expect(result.fileName).toContain('Test_Case');
      expect(result.fileName).toContain('.docx');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.buffer).toBeDefined();
    });

    it('should handle plain text content when Lexical content is missing', async () => {
      const mockDraft = {
        id: 'draft-123',
        projectId: 'project-123',
        currentVersion: 1,
        content: null,
        plainText: 'Plain text content\nLine 2\nLine 3',
        project: {
          id: 'project-123',
          firmId: 'firm-123',
          title: 'Test Case',
          clientName: 'Jane Doe',
          template: {
            id: 'template-123',
            name: 'Standard Demand Letter',
          },
        },
      };

      const { db } = await import('../../../lib/db/client');
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'export-124',
              draftId: 'draft-123',
              version: 1,
              format: 'docx',
              fileName: 'Test_Case_v1_2025-11-11.docx',
              fileSize: 1024,
            },
          ]),
        }),
      } as any);

      const result = await exportDraft({
        draftId: 'draft-123',
        format: 'docx',
        userId: 'user-123',
      });

      expect(result).toBeDefined();
      expect(result.buffer).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should handle rich text formatting (bold, italic, underline)', async () => {
      const mockDraft = {
        id: 'draft-123',
        projectId: 'project-123',
        currentVersion: 1,
        content: {
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Bold text',
                    format: 1, // bold
                  },
                  {
                    type: 'text',
                    text: ' and italic text',
                    format: 2, // italic
                  },
                ],
              },
            ],
          },
        },
        plainText: 'Bold text and italic text',
        project: {
          id: 'project-123',
          firmId: 'firm-123',
          title: 'Test Case',
          clientName: 'Test Client',
          template: {
            id: 'template-123',
            name: 'Standard Demand Letter',
          },
        },
      };

      const { db } = await import('../../../lib/db/client');
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'export-125',
              draftId: 'draft-123',
              version: 1,
              format: 'docx',
              fileName: 'Test_Case_v1_2025-11-11.docx',
              fileSize: 1024,
            },
          ]),
        }),
      } as any);

      const result = await exportDraft({
        draftId: 'draft-123',
        format: 'docx',
        userId: 'user-123',
      });

      expect(result).toBeDefined();
      expect(result.buffer).toBeDefined();
    });

    it('should handle headings', async () => {
      const mockDraft = {
        id: 'draft-123',
        projectId: 'project-123',
        currentVersion: 1,
        content: {
          root: {
            children: [
              {
                type: 'heading',
                tag: 'h1',
                children: [
                  {
                    type: 'text',
                    text: 'Main Heading',
                  },
                ],
              },
              {
                type: 'heading',
                tag: 'h2',
                children: [
                  {
                    type: 'text',
                    text: 'Subheading',
                  },
                ],
              },
            ],
          },
        },
        plainText: 'Main Heading\nSubheading',
        project: {
          id: 'project-123',
          firmId: 'firm-123',
          title: 'Test Case',
          clientName: 'Test Client',
          template: {
            id: 'template-123',
            name: 'Standard Demand Letter',
          },
        },
      };

      const { db } = await import('../../../lib/db/client');
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'export-126',
              draftId: 'draft-123',
              version: 1,
              format: 'docx',
              fileName: 'Test_Case_v1_2025-11-11.docx',
              fileSize: 1024,
            },
          ]),
        }),
      } as any);

      const result = await exportDraft({
        draftId: 'draft-123',
        format: 'docx',
        userId: 'user-123',
      });

      expect(result).toBeDefined();
      expect(result.buffer).toBeDefined();
    });

    it('should include metadata when requested', async () => {
      const mockDraft = {
        id: 'draft-123',
        projectId: 'project-123',
        currentVersion: 5,
        content: {
          root: {
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Draft content',
                  },
                ],
              },
            ],
          },
        },
        plainText: 'Draft content',
        project: {
          id: 'project-123',
          firmId: 'firm-123',
          title: 'Test Case',
          clientName: 'Test Client',
          template: {
            id: 'template-123',
            name: 'Standard Demand Letter',
          },
        },
      };

      const { db } = await import('../../../lib/db/client');
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'export-127',
              draftId: 'draft-123',
              version: 5,
              format: 'docx',
              fileName: 'Test_Case_v5_2025-11-11.docx',
              fileSize: 1024,
              metadata: {
                projectTitle: 'Test Case',
                clientName: 'Test Client',
                templateName: 'Standard Demand Letter',
              },
            },
          ]),
        }),
      } as any);

      const result = await exportDraft({
        draftId: 'draft-123',
        format: 'docx',
        userId: 'user-123',
        includeMetadata: true,
      });

      expect(result).toBeDefined();
      expect(result.fileName).toContain('v5');
    });

    it('should throw error if draft not found', async () => {
      const { db } = await import('../../../lib/db/client');
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(null);

      await expect(
        exportDraft({
          draftId: 'nonexistent',
          format: 'docx',
          userId: 'user-123',
        })
      ).rejects.toThrow('Draft not found');
    });

    it('should reject unsupported formats', async () => {
      await expect(
        exportDraft({
          draftId: 'draft-123',
          format: 'pdf' as any,
          userId: 'user-123',
        })
      ).rejects.toThrow('Only .docx format is currently supported');
    });
  });

  describe('getDraftExports', () => {
    it('should return export history for a draft', async () => {
      const mockExports = [
        {
          id: 'export-1',
          draftId: 'draft-123',
          version: 3,
          format: 'docx',
          fileName: 'Test_Case_v3.docx',
          fileSize: 2048,
          exportedBy: 'user-123',
          createdAt: new Date('2025-11-11'),
          exporter: {
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          id: 'export-2',
          draftId: 'draft-123',
          version: 2,
          format: 'docx',
          fileName: 'Test_Case_v2.docx',
          fileSize: 1536,
          exportedBy: 'user-456',
          createdAt: new Date('2025-11-10'),
          exporter: {
            id: 'user-456',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        },
      ];

      const { db } = await import('../../../lib/db/client');
      vi.mocked(db.query.draftExports.findMany).mockResolvedValue(mockExports as any);

      const result = await getDraftExports('draft-123');

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(3);
      expect(result[0].exporter.firstName).toBe('John');
      expect(result[1].version).toBe(2);
    });

    it('should return empty array for draft with no exports', async () => {
      const { db } = await import('../../../lib/db/client');
      vi.mocked(db.query.draftExports.findMany).mockResolvedValue([]);

      const result = await getDraftExports('draft-123');

      expect(result).toEqual([]);
    });
  });
});
