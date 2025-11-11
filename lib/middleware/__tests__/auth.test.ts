/**
 * Unit Tests for Auth Middleware
 * Tests requireRole() function with different role scenarios
 */

import { describe, it, expect } from 'vitest';
import { requireRole, AuthenticatedUser } from '../auth';
import { ForbiddenError } from '../../errors';

describe('requireRole middleware', () => {
  // Mock user data for testing
  const mockAdmin: AuthenticatedUser = {
    userId: 'user-admin-123',
    email: 'admin@example.com',
    role: 'admin',
    firmId: 'firm-123',
  };

  const mockAttorney: AuthenticatedUser = {
    userId: 'user-attorney-456',
    email: 'attorney@example.com',
    role: 'attorney',
    firmId: 'firm-123',
  };

  const mockParalegal: AuthenticatedUser = {
    userId: 'user-paralegal-789',
    email: 'paralegal@example.com',
    role: 'paralegal',
    firmId: 'firm-123',
  };

  describe('single role requirement', () => {
    it('should allow admin when admin role required', () => {
      expect(() => requireRole(mockAdmin, ['admin'])).not.toThrow();
    });

    it('should allow attorney when attorney role required', () => {
      expect(() => requireRole(mockAttorney, ['attorney'])).not.toThrow();
    });

    it('should allow paralegal when paralegal role required', () => {
      expect(() => requireRole(mockParalegal, ['paralegal'])).not.toThrow();
    });

    it('should throw ForbiddenError when attorney tries to access admin-only resource', () => {
      expect(() => requireRole(mockAttorney, ['admin'])).toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when paralegal tries to access admin-only resource', () => {
      expect(() => requireRole(mockParalegal, ['admin'])).toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when paralegal tries to access attorney-only resource', () => {
      expect(() => requireRole(mockParalegal, ['attorney'])).toThrow(ForbiddenError);
    });
  });

  describe('multiple role requirements', () => {
    it('should allow admin when admin or attorney required', () => {
      expect(() => requireRole(mockAdmin, ['admin', 'attorney'])).not.toThrow();
    });

    it('should allow attorney when admin or attorney required', () => {
      expect(() => requireRole(mockAttorney, ['admin', 'attorney'])).not.toThrow();
    });

    it('should throw ForbiddenError when paralegal tries to access admin/attorney resource', () => {
      expect(() => requireRole(mockParalegal, ['admin', 'attorney'])).toThrow(
        ForbiddenError
      );
    });

    it('should allow paralegal when attorney or paralegal required', () => {
      expect(() => requireRole(mockParalegal, ['attorney', 'paralegal'])).not.toThrow();
    });

    it('should allow any role when all roles are allowed', () => {
      expect(() => requireRole(mockAdmin, ['admin', 'attorney', 'paralegal'])).not.toThrow();
      expect(() => requireRole(mockAttorney, ['admin', 'attorney', 'paralegal'])).not.toThrow();
      expect(() => requireRole(mockParalegal, ['admin', 'attorney', 'paralegal'])).not.toThrow();
    });
  });

  describe('error messages', () => {
    it('should include required roles in error message', () => {
      try {
        requireRole(mockParalegal, ['admin']);
        expect.fail('Should have thrown ForbiddenError');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as ForbiddenError).message).toContain('admin');
      }
    });

    it('should include all required roles in error message for multiple roles', () => {
      try {
        requireRole(mockParalegal, ['admin', 'attorney']);
        expect.fail('Should have thrown ForbiddenError');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as ForbiddenError).message).toContain('admin');
        expect((error as ForbiddenError).message).toContain('attorney');
      }
    });

    it('should return HTTP 403 status code', () => {
      try {
        requireRole(mockAttorney, ['admin']);
        expect.fail('Should have thrown ForbiddenError');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as ForbiddenError).statusCode).toBe(403);
      }
    });
  });
});
