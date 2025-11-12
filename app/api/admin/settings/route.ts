/**
 * Admin Settings API Route
 * GET /api/admin/settings - Get firm settings (admin only)
 * PATCH /api/admin/settings - Update firm settings (admin only)
 * Story 6.13 - Admin Panel Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { firms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  letterheadCompanyName: z.string().max(255).optional(),
  letterheadAddress: z.string().optional(),
  letterheadPhone: z.string().max(50).optional(),
  letterheadEmail: z.string().email().max(255).optional(),
  letterheadWebsite: z.string().url().max(255).optional(),
  exportMargins: z.object({
    top: z.number().min(0).max(5),
    bottom: z.number().min(0).max(5),
    left: z.number().min(0).max(5),
    right: z.number().min(0).max(5),
  }).optional(),
  exportFontFamily: z.string().max(100).optional(),
  exportFontSize: z.number().min(8).max(20).optional(),
});

/**
 * GET /api/admin/settings
 * Get firm settings
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    requireRole(auth, ['admin']);

    const firm = await db.query.firms.findFirst({
      where: eq(firms.id, auth.firmId),
    });

    if (!firm) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Firm not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ firm });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch settings',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Update firm settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    requireRole(auth, ['admin']);

    const body = await request.json();
    const data = updateSettingsSchema.parse(body);

    const updated = await db
      .update(firms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(firms.id, auth.firmId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Firm not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ firm: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.issues,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating settings:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update settings',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
