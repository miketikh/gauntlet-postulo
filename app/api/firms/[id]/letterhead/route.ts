/**
 * Firm Letterhead API Routes
 * GET/PATCH /api/firms/[id]/letterhead - Manage firm letterhead settings
 * Part of Story 5.9 - Firm Letterhead Configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { firms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/middleware/auth';
import { z } from 'zod';

const LetterheadSettingsSchema = z.object({
  letterheadCompanyName: z.string().max(255).optional(),
  letterheadAddress: z.string().optional(),
  letterheadPhone: z.string().max(50).optional(),
  letterheadEmail: z.string().email().max(255).optional(),
  letterheadWebsite: z.string().url().max(255).optional(),
  exportMargins: z.object({
    top: z.number().min(0.5).max(2),
    bottom: z.number().min(0.5).max(2),
    left: z.number().min(0.5).max(2),
    right: z.number().min(0.5).max(2),
  }).optional(),
  exportFontFamily: z.enum(['Times New Roman', 'Arial', 'Calibri']).optional(),
  exportFontSize: z.number().min(10).max(14).optional(),
});

/**
 * GET /api/firms/[id]/letterhead
 * Get firm letterhead settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: firmId } = await params;
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify firm access
    if (auth.firmId !== firmId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Get firm letterhead settings
    const firm = await db.query.firms.findFirst({
      where: eq(firms.id, firmId),
      columns: {
        id: true,
        letterheadLogoS3Key: true,
        letterheadCompanyName: true,
        letterheadAddress: true,
        letterheadPhone: true,
        letterheadEmail: true,
        letterheadWebsite: true,
        exportMargins: true,
        exportFontFamily: true,
        exportFontSize: true,
      },
    });

    if (!firm) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Firm not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      letterhead: firm,
    });
  } catch (error) {
    console.error('Error fetching letterhead settings:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch letterhead settings' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/firms/[id]/letterhead
 * Update firm letterhead settings (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: firmId } = await params;
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify firm access
    if (auth.firmId !== firmId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Only admins can update letterhead settings
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = LetterheadSettingsSchema.parse(body);

    // Update firm letterhead settings
    const [updatedFirm] = await db
      .update(firms)
      .set({
        ...validatedBody,
        updatedAt: new Date(),
      })
      .where(eq(firms.id, firmId))
      .returning({
        id: firms.id,
        letterheadLogoS3Key: firms.letterheadLogoS3Key,
        letterheadCompanyName: firms.letterheadCompanyName,
        letterheadAddress: firms.letterheadAddress,
        letterheadPhone: firms.letterheadPhone,
        letterheadEmail: firms.letterheadEmail,
        letterheadWebsite: firms.letterheadWebsite,
        exportMargins: firms.exportMargins,
        exportFontFamily: firms.exportFontFamily,
        exportFontSize: firms.exportFontSize,
      });

    if (!updatedFirm) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Firm not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      letterhead: updatedFirm,
    });
  } catch (error) {
    console.error('Error updating letterhead settings:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update letterhead settings' } },
      { status: 500 }
    );
  }
}
