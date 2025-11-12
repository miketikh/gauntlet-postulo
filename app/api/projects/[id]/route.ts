/**
 * Single Project API - Get project by ID (firm-isolated)
 * CRITICAL: Returns 404 (not 403) for cross-firm access
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError, createErrorResponse, ValidationError } from '@/lib/errors';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/:id
 * Returns single project if it belongs to authenticated user's firm
 * SECURITY: Returns 404 (not 403) if project doesn't exist or belongs to different firm
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth(req);
    const { id: projectId } = await context.params;

    // CRITICAL: Filter by BOTH id AND firmId
    // This ensures users can only access projects from their firm
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.firmId, user.firmId)
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
        template: true,
        sourceDocuments: true,
        draft: true,
      }
    });

    // CRITICAL: Return 404, not 403, to avoid information disclosure
    // This prevents attackers from knowing if a project ID exists
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * Request body validation schema for updating a project
 */
const updateProjectSchema = z.object({
  templateId: z.string().uuid('Invalid template ID').optional(),
  variables: z.record(z.string(), z.any()).optional(),
  title: z.string().min(1, 'Title is required').optional(),
  clientName: z.string().min(1, 'Client name is required').optional(),
  status: z.enum(['draft', 'in_review', 'completed', 'sent']).optional(),
});

/**
 * PATCH /api/projects/:id
 * Update project fields (template, variables, title, etc.)
 * SECURITY: Only allows updating projects from user's firm
 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const user = await requireAuth(req);
    const { id: projectId } = await context.params;

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateProjectSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid request body', validationResult.error.issues);
    }

    // Check that project exists and belongs to user's firm
    const existingProject = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.firmId, user.firmId)
      ),
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validationResult.data.templateId !== undefined) {
      updateData.templateId = validationResult.data.templateId;
    }
    if (validationResult.data.variables !== undefined) {
      updateData.caseDetails = validationResult.data.variables;
    }
    if (validationResult.data.title !== undefined) {
      updateData.title = validationResult.data.title;
    }
    if (validationResult.data.clientName !== undefined) {
      updateData.clientName = validationResult.data.clientName;
    }
    if (validationResult.data.status !== undefined) {
      updateData.status = validationResult.data.status;
    }

    // Update project
    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({
      project: updatedProject,
      message: 'Project updated successfully',
    });

  } catch (error) {
    console.error('Error updating project:', error);

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    const errorResponse = createErrorResponse(new Error('Internal server error'));
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
