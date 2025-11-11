/**
 * Template Versions API
 * Story 3.2: Template CRUD API Endpoints
 * GET /api/templates/:id/versions - Get version history
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { templates, templateVersions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createErrorResponse, NotFoundError } from '@/lib/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/templates/:id/versions
 * Returns version history for a template
 * AC #8: Get version history
 * SECURITY: Only returns versions for templates belonging to user's firm
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth(req);
    const { id: templateId } = await context.params;

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

    // Get all versions for this template
    const versions = await db.query.templateVersions.findMany({
      where: eq(templateVersions.templateId, templateId),
      orderBy: [desc(templateVersions.versionNumber)],
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

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        currentVersion: template.version,
      },
      versions,
    });

  } catch (error) {
    console.error('Error fetching template versions:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
