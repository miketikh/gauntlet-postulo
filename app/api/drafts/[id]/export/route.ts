/**
 * Draft Export API Routes
 * POST /api/drafts/[id]/export - Export draft to Word document
 * Part of Story 5.7 - Implement Word Document Export
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { drafts, projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/middleware/auth';
import { exportDraft } from '@/lib/services/export.service';
import { getPresignedUrl } from '@/lib/services/storage.service';
import { sendExportEmail, isValidEmail } from '@/lib/services/email.service';
import { z } from 'zod';
import { auditExportCreate, auditLog } from '@/lib/middleware/audit.middleware';
import { AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/services/audit.service';

const ExportRequestSchema = z.object({
  format: z.enum(['docx', 'pdf']).optional().default('docx'),
  includeMetadata: z.boolean().optional().default(true),
  returnType: z.enum(['url', 'download']).optional().default('url'),
  deliveryMethod: z.enum(['download', 'email']).optional().default('download'),
  recipientEmail: z.string().email().optional(),
});

/**
 * POST /api/drafts/[id]/export
 * Export draft to Word document (.docx)
 *
 * Request body:
 * - format: 'docx' | 'pdf' (default: 'docx')
 * - includeMetadata: boolean (default: true)
 * - returnType: 'url' | 'download' (default: 'url')
 * - deliveryMethod: 'download' | 'email' (default: 'download') - Story 5.11
 * - recipientEmail: string (required if deliveryMethod='email') - Story 5.11
 *
 * Response:
 * - If returnType='url': { exportId, fileName, presignedUrl, fileSize }
 * - If returnType='download': Binary file download
 * - If deliveryMethod='email': { exportId, fileName, emailSent: true }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = ExportRequestSchema.parse(body);

    // Validate email if delivery method is email
    if (validatedBody.deliveryMethod === 'email') {
      if (!validatedBody.recipientEmail) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Recipient email is required for email delivery' } },
          { status: 400 }
        );
      }
      if (!isValidEmail(validatedBody.recipientEmail)) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid email address' } },
          { status: 400 }
        );
      }
    }

    // Get draft and verify access
    const draft = await db.query.drafts.findFirst({
      where: eq(drafts.id, draftId),
      with: {
        project: {
          with: {
            firm: true,
          },
        },
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }

    // Verify firm access
    if (draft.project.firmId !== auth.firmId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Export draft
    const exportResult = await exportDraft({
      draftId,
      format: validatedBody.format,
      userId: auth.userId,
      includeMetadata: validatedBody.includeMetadata,
      returnBuffer: validatedBody.returnType === 'download' || validatedBody.deliveryMethod === 'email',
    });

    // Story 6.8: Audit export creation
    await auditExportCreate(request, auth, draftId, validatedBody.format);

    // Story 5.11: Handle email delivery
    if (validatedBody.deliveryMethod === 'email' && validatedBody.recipientEmail) {
      // For email delivery, we need the buffer
      if (!exportResult.buffer) {
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Export buffer not available for email' } },
          { status: 500 }
        );
      }

      try {
        await sendExportEmail({
          to: validatedBody.recipientEmail,
          subject: `Demand Letter - ${draft.project.title}`,
          attachmentBuffer: exportResult.buffer,
          attachmentFilename: exportResult.fileName,
          firmName: draft.project.firm.name,
          projectTitle: draft.project.title,
        });

        // Story 6.8: Audit email export
        await auditLog(request, auth, {
          action: AUDIT_ACTIONS.EXPORT_EMAIL,
          resourceType: RESOURCE_TYPES.EXPORT,
          resourceId: exportResult.exportId,
          metadata: { recipientEmail: validatedBody.recipientEmail },
        });

        return NextResponse.json({
          export: {
            id: exportResult.exportId,
            fileName: exportResult.fileName,
            fileSize: exportResult.fileSize,
            emailSent: true,
            recipientEmail: validatedBody.recipientEmail,
            createdAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json(
          { error: { code: 'EMAIL_FAILED', message: 'Failed to send email' } },
          { status: 500 }
        );
      }
    }

    // Return based on returnType
    if (validatedBody.returnType === 'download') {
      // Return file for direct download
      if (!exportResult.buffer) {
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Export buffer not available' } },
          { status: 500 }
        );
      }

      return new NextResponse(Buffer.from(exportResult.buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${exportResult.fileName}"`,
          'Content-Length': exportResult.fileSize.toString(),
        },
      });
    } else {
      // Return presigned URL
      let presignedUrl: string | undefined;

      if (exportResult.s3Key) {
        presignedUrl = await getPresignedUrl(exportResult.s3Key, 3600); // 1 hour expiry
      }

      return NextResponse.json({
        export: {
          id: exportResult.exportId,
          fileName: exportResult.fileName,
          fileSize: exportResult.fileSize,
          presignedUrl,
          createdAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error exporting draft:', error);

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
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to export draft' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/drafts/[id]/export
 * Get export history for a draft
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: draftId } = await params;
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get draft and verify access
    const draft = await db.query.drafts.findFirst({
      where: eq(drafts.id, draftId),
      with: {
        project: true,
        exports: {
          with: {
            exporter: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: (exports, { desc }) => [desc(exports.createdAt)],
        },
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }

    // Verify firm access
    if (draft.project.firmId !== auth.firmId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      exports: draft.exports,
    });
  } catch (error) {
    console.error('Error fetching export history:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch export history' } },
      { status: 500 }
    );
  }
}
