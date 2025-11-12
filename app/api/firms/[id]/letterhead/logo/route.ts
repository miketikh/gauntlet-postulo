/**
 * Firm Logo Upload API Route
 * POST /api/firms/[id]/letterhead/logo - Upload firm logo
 * Part of Story 5.9 - Firm Letterhead Configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { firms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/middleware/auth';
import { uploadFile } from '@/lib/services/storage.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/firms/[id]/letterhead/logo
 * Upload firm logo (admin only)
 *
 * Accepts multipart/form-data with 'logo' field
 * Supported formats: PNG, JPG, JPEG, SVG
 * Max size: 5MB
 */
export async function POST(
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

    // Only admins can upload logo
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Logo file is required' } },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid file type. Allowed: PNG, JPG, JPEG, SVG',
          },
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File size exceeds 5MB limit',
          },
        },
        { status: 400 }
      );
    }

    // Generate S3 key
    const fileExtension = file.name.split('.').pop();
    const s3Key = `letterheads/${firmId}/${uuidv4()}.${fileExtension}`;

    // Convert file to buffer and upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile({
      key: s3Key,
      body: buffer,
      contentType: file.type,
      metadata: {
        firmId,
        uploadedBy: auth.userId,
        originalName: file.name,
      },
    });

    // Update firm with logo S3 key
    const [updatedFirm] = await db
      .update(firms)
      .set({
        letterheadLogoS3Key: s3Key,
        updatedAt: new Date(),
      })
      .where(eq(firms.id, firmId))
      .returning({
        id: firms.id,
        letterheadLogoS3Key: firms.letterheadLogoS3Key,
      });

    if (!updatedFirm) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Firm not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      logo: {
        s3Key: updatedFirm.letterheadLogoS3Key,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload logo' } },
      { status: 500 }
    );
  }
}
