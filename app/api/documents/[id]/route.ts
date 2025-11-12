/**
 * Document Retrieval API Endpoint
 * GET /api/documents/[id]
 *
 * Retrieves document metadata and generates presigned URL for download.
 * Enforces firm isolation through project relationship.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getPresignedUrl } from '@/lib/services/storage.service';
import { db } from '@/lib/db/client';
import { sourceDocuments } from '@/lib/db/schema';
import { createErrorResponse, NotFoundError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

/**
 * GET /api/documents/[id]
 * Get document by ID with presigned URL
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await requireAuth(req);

    // Retrieve document with project relationship
    const document = await db.query.sourceDocuments.findFirst({
      where: eq(sourceDocuments.id, await params.then(p => p.id)),
      with: {
        project: true,
        uploader: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Check if document exists
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Enforce firm isolation - verify document's project belongs to user's firm
    if (document.project.firmId !== user.firmId) {
      throw new NotFoundError('Document not found');
    }

    // Generate presigned URL for secure download
    const presignedUrl = await getPresignedUrl(document.s3Key);

    // Return document with presigned URL
    return NextResponse.json({
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        s3Key: document.s3Key,
        extractionStatus: document.extractionStatus,
        extractedText: document.extractedText,
        uploadedBy: document.uploadedBy,
        createdAt: document.createdAt,
        presignedUrl,
        project: {
          id: document.project.id,
          title: document.project.title,
          clientName: document.project.clientName,
          status: document.project.status,
        },
        uploader: document.uploader,
      },
    });
  } catch (error) {
    console.error('Document retrieval error:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
