/**
 * Admin Analytics API Tests
 * Story 6.13 - Admin Panel Dashboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../analytics/route';
import * as authMiddleware from '@/lib/middleware/auth';
import * as exportAnalyticsService from '@/lib/services/export-analytics.service';

// Mock the auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

// Mock the database and services
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ count: 0 }])),
      })),
    })),
    query: {
      projects: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
      users: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
    },
  },
}));

vi.mock('@/lib/services/export-analytics.service', () => ({
  getExportStats: vi.fn(),
}));

describe('GET /api/admin/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    // Mock authentication failure
    vi.mocked(authMiddleware.requireAuth).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/admin/analytics');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should require admin role', async () => {
    // Mock authenticated non-admin user
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      userId: 'user-1',
      email: 'attorney@firm.com',
      role: 'attorney',
      firmId: 'firm-1',
    });

    // Mock role check throwing error
    vi.mocked(authMiddleware.requireRole).mockImplementation(() => {
      throw new Error('Forbidden');
    });

    const request = new NextRequest('http://localhost:3000/api/admin/analytics');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should return analytics for admin user', async () => {
    // Mock authenticated admin user
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      userId: 'user-1',
      email: 'admin@firm.com',
      role: 'admin',
      firmId: 'firm-1',
    });

    vi.mocked(authMiddleware.requireRole).mockReturnValue(undefined);

    // Mock export stats
    vi.mocked(exportAnalyticsService.getExportStats).mockResolvedValue({
      totalExports: 10,
      exportsByFormat: { docx: 7, pdf: 3 },
      exportsByUser: [],
      recentExports: [],
      averageFileSize: 50000,
      exportsByVersion: [],
    });

    const request = new NextRequest('http://localhost:3000/api/admin/analytics');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('totalProjects');
    expect(data).toHaveProperty('activeUsers');
    expect(data).toHaveProperty('exportStats');
  });
});
