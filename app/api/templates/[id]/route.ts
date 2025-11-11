/**
 * Templates API Endpoint - Single Template
 * Story 3.2: Template CRUD API Endpoints
 * Story 3.9: Template Access Control and Sharing (RBAC implementation)
 *
 * GET /api/templates/[id] - Get template by ID
 * PUT /api/templates/[id] - Update template with auto-versioning (admin/attorney only)
 * DELETE /api/templates/[id] - Soft delete template (admin/attorney only)
 *
 * Access Control:
 * - All firm members can view templates
 * - Only admin and attorney can modify templates
 * - Unauthorized edits return 403 Forbidden
 * - Cross-firm access returns 404 (not 403) to prevent information disclosure
 *
 * Audit Trail:
 * - Template version history tracks who created/modified each version
 * - See templateVersions.createdBy for audit log
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { templates, templateVersions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createErrorResponse, NotFoundError, ValidationError } from '@/lib/errors';
import { updateTemplateSchema } from '@/lib/validations/template';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/templates/:id
 * Returns single template if it belongs to authenticated user's firm
 * AC #2: Get single template with full structure
 * SECURITY: Returns 404 (not 403) if template doesn't exist or belongs to different firm
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth(req);
    const { id: templateId } = await context.params;

    // CRITICAL: Filter by BOTH id AND firmId
    // This ensures users can only access templates from their firm
    const template = await db.query.templates.findFirst({
      where: and(
        eq(templates.id, templateId),
        eq(templates.firmId, user.firmId)
      ),
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      }
    });

    // CRITICAL: Return 404, not 403, to avoid information disclosure
    // This prevents attackers from knowing if a template ID exists
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * PUT /api/templates/:id
 * Update template and automatically create new version
 * AC #4: Updates template and creates version automatically
 * AC #7: Validates required fields and section types
 *
 * RBAC: Only admins and attorneys can update templates
 */
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth(req);
    requireRole(user, ['admin', 'attorney']);

    const { id: templateId } = await context.params;

    // Verify template exists and belongs to user's firm
    const existingTemplate = await db.query.templates.findFirst({
      where: and(
        eq(templates.id, templateId),
        eq(templates.firmId, user.firmId)
      ),
    });

    if (!existingTemplate) {
      throw new NotFoundError('Template not found');
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid template data', validationResult.error.issues);
    }

    const updateData = validationResult.data;
    const newVersion = existingTemplate.version + 1;

    // Merge sections and variables if provided
    const updatedSections = updateData.sections !== undefined
      ? updateData.sections
      : existingTemplate.sections;
    const updatedVariables = updateData.variables !== undefined
      ? updateData.variables
      : existingTemplate.variables;

    // Update template and create version in transaction
    const [updatedTemplate] = await db.transaction(async (tx) => {
      // Update template
      const [updated] = await tx
        .update(templates)
        .set({
          name: updateData.name !== undefined ? updateData.name : existingTemplate.name,
          description: updateData.description !== undefined ? updateData.description : existingTemplate.description,
          sections: updatedSections,
          variables: updatedVariables,
          version: newVersion,
          updatedAt: new Date(),
        })
        .where(eq(templates.id, templateId))
        .returning();

      // Create version record
      await tx.insert(templateVersions).values({
        templateId: templateId,
        versionNumber: newVersion,
        structure: {
          sections: updatedSections,
          variables: updatedVariables,
        },
        createdBy: user.userId,
      });

      return [updated];
    });

    return NextResponse.json({
      template: updatedTemplate,
      message: 'Template updated successfully',
    });

  } catch (error) {
    console.error('Template update error:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * DELETE /api/templates/:id
 * Soft delete template (sets isActive: false)
 * AC #5: Soft deletes template
 *
 * RBAC: Only admins and attorneys can delete templates
 */
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth(req);
    requireRole(user, ['admin', 'attorney']);

    const { id: templateId } = await context.params;

    // Verify template exists and belongs to user's firm
    const existingTemplate = await db.query.templates.findFirst({
      where: and(
        eq(templates.id, templateId),
        eq(templates.firmId, user.firmId)
      ),
    });

    if (!existingTemplate) {
      throw new NotFoundError('Template not found');
    }

    // Soft delete by setting isActive to false
    await db
      .update(templates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId));

    return NextResponse.json({
      message: 'Template deleted successfully',
    });

  } catch (error) {
    console.error('Template deletion error:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
