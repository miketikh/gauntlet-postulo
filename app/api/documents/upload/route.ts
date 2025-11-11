/**
 * Document Upload API Endpoint
 * POST /api/documents/upload
 *
 * Handles multipart form data uploads, validates files,
 * stores in S3, and creates database records with proper firm isolation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { uploadDocumentToS3, getPresignedUrl } from '@/lib/services/storage.service';
import { processDocumentExtraction } from '@/lib/services/extraction.service';
import { db } from '@/lib/db/client';
import { sourceDocuments, projects } from '@/lib/db/schema';
import { createErrorResponse, ValidationError, NotFoundError } from '@/lib/errors';
import { eq, and } from 'drizzle-orm';

// File validation constants
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.jpeg', '.jpg', '.png'];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/documents/upload
 * Upload a document file to S3 and create database record
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;

    // Validate required fields
    if (!file) {
      throw new ValidationError('File is required');
    }

    if (!projectId) {
      throw new ValidationError('projectId is required');
    }

    // Verify project exists and belongs to user's firm
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.firmId, user.firmId)
      ),
    });

    if (!project) {
      throw new NotFoundError('Project not found or access denied');
    }

    // Validate file type by MIME type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new ValidationError(
        `Invalid file type: ${file.type}. Accepted types: PDF, DOCX, JPEG, PNG`
      );
    }

    // Additional validation: check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      throw new ValidationError(
        `Invalid file extension. Accepted extensions: ${ACCEPTED_EXTENSIONS.join(', ')}`
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      throw new ValidationError(
        `File size exceeds maximum limit of 50MB. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );
    }

    // Validate file is not empty
    if (file.size === 0) {
      throw new ValidationError('File is empty');
    }

    // Generate document ID
    const documentId = crypto.randomUUID();

    // Create S3 key with firm isolation: {firmId}/{projectId}/{documentId}-{filename}
    const s3Key = `${user.firmId}/${projectId}/${documentId}-${file.name}`;

    // Upload to S3
    await uploadDocumentToS3(file, s3Key);

    // Create database record
    const [document] = await db
      .insert(sourceDocuments)
      .values({
        id: documentId,
        projectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        s3Key,
        extractionStatus: 'pending',
        uploadedBy: user.userId,
      })
      .returning();

    // Generate presigned URL for immediate download access
    const presignedUrl = await getPresignedUrl(s3Key);

    // Trigger extraction asynchronously for all supported file types (don't await)
    if (
      document.fileType === 'application/pdf' ||
      document.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      document.fileType.startsWith('image/')
    ) {
      processDocumentExtraction(document.id).catch((err) => {
        console.error('Background extraction failed:', err);
      });
    }

    // Return success response
    return NextResponse.json(
      {
        document: {
          id: document.id,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          extractionStatus: document.extractionStatus,
          uploadedBy: document.uploadedBy,
          createdAt: document.createdAt,
          presignedUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Document upload error:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
