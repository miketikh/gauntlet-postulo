/**
 * Admin Settings API Tests
 * Story 6.13 - Admin Panel Dashboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '../settings/route';
import * as authMiddleware from '@/lib/middleware/auth';

// Mock the auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(),
}));

// Mock the database
vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      firms: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'firm-1', name: 'Test Firm' }])),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  firms: {},
}));

const mockDb = await import('@/lib/db/client');

describe('GET /api/admin/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require admin role', async () => {
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      userId: 'user-1',
      email: 'attorney@firm.com',
      role: 'attorney',
      firmId: 'firm-1',
    });

    vi.mocked(authMiddleware.requireRole).mockImplementation(() => {
      throw new Error('Forbidden');
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should return firm settings for admin', async () => {
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      userId: 'user-1',
      email: 'admin@firm.com',
      role: 'admin',
      firmId: 'firm-1',
    });

    vi.mocked(authMiddleware.requireRole).mockReturnValue(undefined);

    const mockFirm = {
      id: 'firm-1',
      name: 'Test Firm',
      letterheadCompanyName: 'Test Firm LLC',
      letterheadAddress: '123 Main St',
      letterheadPhone: '555-0100',
      letterheadEmail: 'contact@testfirm.com',
      letterheadWebsite: 'https://testfirm.com',
      letterheadLogoS3Key: null,
      exportMargins: { top: 1, bottom: 1, left: 1, right: 1 },
      exportFontFamily: 'Times New Roman',
      exportFontSize: 12,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(mockDb.db.query.firms.findFirst).mockResolvedValue(mockFirm);

    const request = new NextRequest('http://localhost:3000/api/admin/settings');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.firm).toHaveProperty('id', 'firm-1');
    expect(data.firm).toHaveProperty('name', 'Test Firm');
  });
});

describe('PATCH /api/admin/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update firm settings', async () => {
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      userId: 'user-1',
      email: 'admin@firm.com',
      role: 'admin',
      firmId: 'firm-1',
    });

    vi.mocked(authMiddleware.requireRole).mockReturnValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Firm Name' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.firm).toHaveProperty('id');
  });

  it('should validate input', async () => {
    vi.mocked(authMiddleware.requireAuth).mockResolvedValue({
      userId: 'user-1',
      email: 'admin@firm.com',
      role: 'admin',
      firmId: 'firm-1',
    });

    vi.mocked(authMiddleware.requireRole).mockReturnValue(undefined);

    // Invalid email
    const request = new NextRequest('http://localhost:3000/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ letterheadEmail: 'invalid-email' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
