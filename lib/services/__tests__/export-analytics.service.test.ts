/**
 * Export Analytics Service Tests
 * Tests for export analytics functionality
 * Part of Story 5.10 - Export Version Tagging & Analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getExportStats, getDraftExportHistory } from '../export-analytics.service';

// Mock database
vi.mock('../../db/client', () => ({
  db: {
    query: {
      draftExports: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('Export Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExportStats', () => {
    it('calculates total exports correctly', async () => {
      const { db } = await import('../../db/client');

      // Mock export data
      (db.query.draftExports.findMany as any).mockResolvedValue([
        {
          id: '1',
          format: 'docx',
          version: 1,
          fileSize: 50000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          id: '2',
          format: 'docx',
          version: 2,
          fileSize: 60000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ]);

      const stats = await getExportStats('firm-1');

      expect(stats.totalExports).toBe(2);
    });

    it('groups exports by format', async () => {
      const { db } = await import('../../db/client');

      (db.query.draftExports.findMany as any).mockResolvedValue([
        {
          id: '1',
          format: 'docx',
          version: 1,
          fileSize: 50000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          id: '2',
          format: 'pdf',
          version: 1,
          fileSize: 60000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ]);

      const stats = await getExportStats('firm-1');

      expect(stats.exportsByFormat.docx).toBe(1);
      expect(stats.exportsByFormat.pdf).toBe(1);
    });

    it('groups exports by user', async () => {
      const { db } = await import('../../db/client');

      (db.query.draftExports.findMany as any).mockResolvedValue([
        {
          id: '1',
          format: 'docx',
          version: 1,
          fileSize: 50000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          id: '2',
          format: 'docx',
          version: 1,
          fileSize: 60000,
          createdAt: new Date(),
          exportedBy: 'user-2',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        },
        {
          id: '3',
          format: 'docx',
          version: 1,
          fileSize: 55000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ]);

      const stats = await getExportStats('firm-1');

      expect(stats.exportsByUser).toHaveLength(2);
      expect(stats.exportsByUser[0].userId).toBe('user-1');
      expect(stats.exportsByUser[0].count).toBe(2);
      expect(stats.exportsByUser[1].userId).toBe('user-2');
      expect(stats.exportsByUser[1].count).toBe(1);
    });

    it('calculates average file size', async () => {
      const { db } = await import('../../db/client');

      (db.query.draftExports.findMany as any).mockResolvedValue([
        {
          id: '1',
          format: 'docx',
          version: 1,
          fileSize: 50000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          id: '2',
          format: 'docx',
          version: 1,
          fileSize: 60000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ]);

      const stats = await getExportStats('firm-1');

      expect(stats.averageFileSize).toBe(55000);
    });

    it('filters exports by firm', async () => {
      const { db } = await import('../../db/client');

      (db.query.draftExports.findMany as any).mockResolvedValue([
        {
          id: '1',
          format: 'docx',
          version: 1,
          fileSize: 50000,
          createdAt: new Date(),
          exportedBy: 'user-1',
          draft: {
            project: {
              firmId: 'firm-1',
            },
          },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          id: '2',
          format: 'docx',
          version: 1,
          fileSize: 60000,
          createdAt: new Date(),
          exportedBy: 'user-2',
          draft: {
            project: {
              firmId: 'firm-2', // Different firm
            },
          },
          exporter: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        },
      ]);

      const stats = await getExportStats('firm-1');

      expect(stats.totalExports).toBe(1);
    });
  });

  describe('getDraftExportHistory', () => {
    it('returns export history for a draft', async () => {
      const { db } = await import('../../db/client');

      (db.query.draftExports.findMany as any).mockResolvedValue([
        {
          id: '1',
          fileName: 'test.docx',
          format: 'docx',
          version: 1,
          fileSize: 50000,
          createdAt: new Date(),
          s3Key: 'exports/test.docx',
          metadata: { test: true },
          exporter: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
      ]);

      const history = await getDraftExportHistory('draft-1');

      expect(history).toHaveLength(1);
      expect(history[0].fileName).toBe('test.docx');
      expect(history[0].format).toBe('docx');
      expect(history[0].exportedBy.name).toBe('John Doe');
    });
  });
});
