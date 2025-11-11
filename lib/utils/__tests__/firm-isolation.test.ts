/**
 * Unit Tests for Firm Isolation Utilities
 * Verifies that firm isolation functions properly enforce security boundaries
 */

import { describe, it, expect, vi } from 'vitest';
import { verifyFirmAccess, assertFirmAccess } from '../firm-isolation';
import { NotFoundError } from '@/lib/errors';

describe('Firm Isolation Utilities', () => {
  describe('verifyFirmAccess', () => {
    it('should throw NotFoundError if resource not found', async () => {
      // Mock db query that returns null (resource doesn't exist)
      const mockQueryTable = {
        findFirst: vi.fn().mockResolvedValue(null)
      };

      const mockTable = {
        id: 'id-column',
        firmId: 'firmId-column'
      };

      await expect(
        verifyFirmAccess(
          mockQueryTable,
          mockTable,
          'nonexistent-project-id',
          'firm-123',
          'Project'
        )
      ).rejects.toThrow(NotFoundError);

      await expect(
        verifyFirmAccess(
          mockQueryTable,
          mockTable,
          'nonexistent-project-id',
          'firm-123',
          'Project'
        )
      ).rejects.toThrow('Project not found');
    });

    it('should throw NotFoundError with 404 status code', async () => {
      const mockQueryTable = {
        findFirst: vi.fn().mockResolvedValue(null)
      };

      const mockTable = {
        id: 'id-column',
        firmId: 'firmId-column'
      };

      try {
        await verifyFirmAccess(
          mockQueryTable,
          mockTable,
          'project-id',
          'firm-id',
          'Project'
        );
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).statusCode).toBe(404);
        expect((error as NotFoundError).code).toBe('NOT_FOUND');
      }
    });

    it('should return resource if found and firmId matches', async () => {
      const mockResource = {
        id: 'project-1',
        firmId: 'firm-1',
        title: 'Test Project',
        clientName: 'John Doe'
      };

      const mockQueryTable = {
        findFirst: vi.fn().mockResolvedValue(mockResource)
      };

      const mockTable = {
        id: 'id-column',
        firmId: 'firmId-column'
      };

      const result = await verifyFirmAccess(
        mockQueryTable,
        mockTable,
        'project-1',
        'firm-1',
        'Project'
      );

      expect(result).toEqual(mockResource);
      expect(mockQueryTable.findFirst).toHaveBeenCalledOnce();
    });

    it('should throw NotFoundError for cross-firm access attempt', async () => {
      // Simulate scenario where resource exists but belongs to different firm
      // Since we filter by BOTH id AND firmId, findFirst returns null
      const mockQueryTable = {
        findFirst: vi.fn().mockResolvedValue(null)
      };

      const mockTable = {
        id: 'id-column',
        firmId: 'firmId-column'
      };

      await expect(
        verifyFirmAccess(
          mockQueryTable,
          mockTable,
          'project-from-firm-2',
          'firm-1', // Different firm
          'Project'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should use custom resource name in error message', async () => {
      const mockQueryTable = {
        findFirst: vi.fn().mockResolvedValue(null)
      };

      const mockTable = {
        id: 'id-column',
        firmId: 'firmId-column'
      };

      await expect(
        verifyFirmAccess(
          mockQueryTable,
          mockTable,
          'template-id',
          'firm-id',
          'Template'
        )
      ).rejects.toThrow('Template not found');
    });
  });

  describe('assertFirmAccess', () => {
    it('should not throw if firmIds match', () => {
      expect(() => {
        assertFirmAccess('firm-1', 'firm-1', 'Project');
      }).not.toThrow();
    });

    it('should throw NotFoundError if firmIds do not match', () => {
      expect(() => {
        assertFirmAccess('firm-1', 'firm-2', 'Project');
      }).toThrow(NotFoundError);

      expect(() => {
        assertFirmAccess('firm-1', 'firm-2', 'Project');
      }).toThrow('Project not found');
    });

    it('should return 404 status code for cross-firm access', () => {
      try {
        assertFirmAccess('firm-1', 'firm-2', 'Project');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).statusCode).toBe(404);
      }
    });

    it('should use custom resource name in error message', () => {
      expect(() => {
        assertFirmAccess('firm-1', 'firm-2', 'Template');
      }).toThrow('Template not found');
    });

    it('should use default resource name if not provided', () => {
      expect(() => {
        assertFirmAccess('firm-1', 'firm-2');
      }).toThrow('Resource not found');
    });
  });

  describe('Security: 404 vs 403', () => {
    it('should always return 404 (not 403) to prevent information disclosure', async () => {
      // This test verifies the critical security requirement:
      // We return 404 instead of 403 so attackers can't determine if a resource exists

      const mockQueryTable = {
        findFirst: vi.fn().mockResolvedValue(null)
      };

      const mockTable = {
        id: 'id-column',
        firmId: 'firmId-column'
      };

      try {
        await verifyFirmAccess(
          mockQueryTable,
          mockTable,
          'resource-id',
          'attacker-firm',
          'Project'
        );
        expect.fail('Should have thrown');
      } catch (error) {
        // CRITICAL: Must be 404, not 403
        expect((error as NotFoundError).statusCode).toBe(404);
        expect((error as NotFoundError).statusCode).not.toBe(403);
        expect((error as NotFoundError).code).toBe('NOT_FOUND');
        expect((error as NotFoundError).code).not.toBe('FORBIDDEN');
      }
    });

    it('assertFirmAccess should also return 404 (not 403)', () => {
      try {
        assertFirmAccess('firm-1', 'attacker-firm', 'Project');
        expect.fail('Should have thrown');
      } catch (error) {
        // CRITICAL: Must be 404, not 403
        expect((error as NotFoundError).statusCode).toBe(404);
        expect((error as NotFoundError).statusCode).not.toBe(403);
      }
    });
  });
});
