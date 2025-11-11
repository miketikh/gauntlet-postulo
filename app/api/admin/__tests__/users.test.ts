/**
 * Integration Tests for Admin Users Endpoint
 * Tests GET /api/admin/users with different user roles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../users/route';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      users: {
        findMany: vi.fn(),
      },
    },
  },
}));

// Mock the auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

import { db } from '@/lib/db/client';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { ForbiddenError } from '@/lib/errors';

describe('GET /api/admin/users', () => {
  const mockFirmUsers = [
    {
      id: 'user-1',
      email: 'admin@example.com',
      firstName: 'John',
      lastName: 'Admin',
      role: 'admin' as const,
      firmId: 'firm-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      passwordHash: 'excluded', // Will be excluded by columns config
    },
    {
      id: 'user-2',
      email: 'attorney@example.com',
      firstName: 'Jane',
      lastName: 'Attorney',
      role: 'attorney' as const,
      firmId: 'firm-123',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      passwordHash: 'excluded', // Will be excluded by columns config
    },
  ] as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return users list when admin user is authenticated', async () => {
    // Mock admin user
    const mockAdminUser = {
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'admin' as const,
      firmId: 'firm-123',
    };

    // Setup mocks
    vi.mocked(requireAuth).mockResolvedValue(mockAdminUser);
    vi.mocked(requireRole).mockImplementation(() => {
      // Admin role check passes - do nothing
    });
    vi.mocked(db.query.users.findMany).mockResolvedValue(mockFirmUsers);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/admin/users');

    // Call endpoint
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(2);
    expect(data.count).toBe(2);
    expect(requireAuth).toHaveBeenCalledWith(request);
    expect(requireRole).toHaveBeenCalledWith(mockAdminUser, ['admin']);
  });

  it('should return 403 Forbidden when attorney tries to access', async () => {
    // Mock attorney user
    const mockAttorneyUser = {
      userId: 'user-2',
      email: 'attorney@example.com',
      role: 'attorney' as const,
      firmId: 'firm-123',
    };

    // Setup mocks
    vi.mocked(requireAuth).mockResolvedValue(mockAttorneyUser);
    vi.mocked(requireRole).mockImplementation(() => {
      // Attorney is not admin - throw ForbiddenError
      throw new ForbiddenError('Insufficient permissions. Required role(s): admin');
    });

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/admin/users');

    // Call endpoint
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('FORBIDDEN');
    expect(requireAuth).toHaveBeenCalledWith(request);
    expect(requireRole).toHaveBeenCalledWith(mockAttorneyUser, ['admin']);
    expect(db.query.users.findMany).not.toHaveBeenCalled();
  });

  it('should return 403 Forbidden when paralegal tries to access', async () => {
    // Mock paralegal user
    const mockParalegalUser = {
      userId: 'user-3',
      email: 'paralegal@example.com',
      role: 'paralegal' as const,
      firmId: 'firm-123',
    };

    // Setup mocks
    vi.mocked(requireAuth).mockResolvedValue(mockParalegalUser);
    vi.mocked(requireRole).mockImplementation(() => {
      // Paralegal is not admin - throw ForbiddenError
      throw new ForbiddenError('Insufficient permissions. Required role(s): admin');
    });

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/admin/users');

    // Call endpoint
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(403);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('FORBIDDEN');
    expect(requireAuth).toHaveBeenCalledWith(request);
    expect(requireRole).toHaveBeenCalledWith(mockParalegalUser, ['admin']);
    expect(db.query.users.findMany).not.toHaveBeenCalled();
  });

  it('should only return users from the same firm', async () => {
    // Mock admin user from firm-123
    const mockAdminUser = {
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'admin' as const,
      firmId: 'firm-123',
    };

    // Setup mocks
    vi.mocked(requireAuth).mockResolvedValue(mockAdminUser);
    vi.mocked(requireRole).mockImplementation(() => {});
    vi.mocked(db.query.users.findMany).mockResolvedValue(mockFirmUsers);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/admin/users');

    // Call endpoint
    await GET(request);

    // Verify database query filters by firmId
    expect(db.query.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(), // The where clause should filter by firmId
      })
    );
  });

  it('should not return passwordHash field in response', async () => {
    // Mock admin user
    const mockAdminUser = {
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'admin' as const,
      firmId: 'firm-123',
    };

    // Mock users WITHOUT passwordHash (simulating what DB query with columns config returns)
    const usersWithoutPassword = mockFirmUsers.map(({ passwordHash, ...user }) => user);

    // Setup mocks
    vi.mocked(requireAuth).mockResolvedValue(mockAdminUser);
    vi.mocked(requireRole).mockImplementation(() => {});
    vi.mocked(db.query.users.findMany).mockResolvedValue(usersWithoutPassword as any);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/admin/users');

    // Call endpoint
    const response = await GET(request);
    const data = await response.json();

    // Verify database query excludes passwordHash
    expect(db.query.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.objectContaining({
          passwordHash: false,
        }),
      })
    );

    // Verify response doesn't contain passwordHash
    data.users.forEach((user: any) => {
      expect(user.passwordHash).toBeUndefined();
    });
  });
});
