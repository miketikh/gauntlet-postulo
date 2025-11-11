/**
 * Document Extraction Status API Endpoint
 * GET /api/documents/:id/extraction
 *
 * Retrieves extraction status and text preview for a document
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { sourceDocuments } from '@/lib/db/schema';
import { createErrorResponse, NotFoundError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

/**
 * GET /api/documents/:id/extraction
 * Check extraction status and get preview
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    // Get document with project relation
    const document = await db.query.sourceDocuments.findFirst({
      where: eq(sourceDocuments.id, id),
      with: { project: true },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Verify user has access to this document (same firm)
    if (document.project.firmId !== user.firmId) {
      throw new NotFoundError('Document not found or access denied');
    }

    // Generate text preview (first 500 characters)
    const preview = document.extractedText
      ? document.extractedText.substring(0, 500) + (document.extractedText.length > 500 ? '...' : '')
      : null;

    // Extract OCR confidence from metadata if available
    const ocrConfidence =
      document.metadata && typeof document.metadata === 'object' && 'ocrConfidence' in document.metadata
        ? (document.metadata as any).ocrConfidence
        : undefined;

    return NextResponse.json({
      status: document.extractionStatus,
      preview,
      fullTextLength: document.extractedText?.length || 0,
      ocrConfidence,
    });
  } catch (error) {
    console.error('Extraction status error:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
