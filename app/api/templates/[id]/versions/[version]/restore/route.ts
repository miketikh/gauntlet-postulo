/**
 * Template Version Restore API
 * Story 3.2: Template CRUD API Endpoints
 * POST /api/templates/:id/versions/:version/restore - Restore previous version
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { templates, templateVersions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createErrorResponse, NotFoundError, ValidationError } from '@/lib/errors';
import { restoreVersionSchema } from '@/lib/validations/template';

interface RouteContext {
  params: Promise<{ id: string; version: string }>;
}

/**
 * POST /api/templates/:id/versions/:version/restore
 * Restore a previous version of a template
 * AC #9: Restore version creates new version (doesn't overwrite current)
 * RBAC: Only admins and attorneys can restore templates
 */
export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth(req);
    requireRole(user, ['admin', 'attorney']);

    const { id: templateId, version: versionNumberStr } = await context.params;
    const versionNumber = parseInt(versionNumberStr, 10);

    if (isNaN(versionNumber) || versionNumber < 1) {
      throw new ValidationError('Invalid version number');
    }

    // Parse request body for optional change description
    const body = await req.json().catch(() => ({}));
    const validationResult = restoreVersionSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid request data', validationResult.error.issues);
    }

    const { changeDescription } = validationResult.data;

    // Verify template exists and belongs to user's firm
    const template = await db.query.templates.findFirst({
      where: and(
        eq(templates.id, templateId),
        eq(templates.firmId, user.firmId)
      ),
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Get the version to restore
    const versionToRestore = await db.query.templateVersions.findFirst({
      where: and(
        eq(templateVersions.templateId, templateId),
        eq(templateVersions.versionNumber, versionNumber)
      ),
    });

    if (!versionToRestore) {
      throw new NotFoundError('Template version not found');
    }

    const newVersion = template.version + 1;
    const restoredStructure = versionToRestore.structure as {
      sections: any[];
      variables: any[];
    };

    // Update template and create new version in transaction
    const [updatedTemplate] = await db.transaction(async (tx) => {
      // Update template with restored structure
      const [updated] = await tx
        .update(templates)
        .set({
          sections: restoredStructure.sections,
          variables: restoredStructure.variables,
          version: newVersion,
          updatedAt: new Date(),
        })
        .where(eq(templates.id, templateId))
        .returning();

      // Create new version record
      await tx.insert(templateVersions).values({
        templateId: templateId,
        versionNumber: newVersion,
        structure: restoredStructure,
        createdBy: user.userId,
      });

      return [updated];
    });

    return NextResponse.json({
      template: updatedTemplate,
      message: `Template restored to version ${versionNumber} (now version ${newVersion})`,
      restoredFromVersion: versionNumber,
      newVersion: newVersion,
    });

  } catch (error) {
    console.error('Template restore error:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
