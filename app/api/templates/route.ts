/**
 * Templates API - List and Create Templates
 * Story 3.2: Template CRUD API Endpoints
 * Story 3.9: Template Access Control and Sharing
 *
 * CRITICAL: All queries filtered by firmId for security
 *
 * RBAC (Role-Based Access Control):
 * - GET (list/view): All firm members (admin, attorney, paralegal)
 * - POST (create): Only admin and attorney
 * - PUT (update): Only admin and attorney
 * - DELETE (soft delete): Only admin and attorney
 *
 * FUTURE ENHANCEMENT (Story 3.9 AC #8):
 * Fine-grained permissions for templates could include:
 * - Template ownership: creator has full control
 * - Shared edit access: specific users can edit even if paralegal
 * - Department-level templates: restrict to specific practice areas
 * - Template sharing: share templates across firms (with approval)
 * - Approval workflows: require admin approval before template becomes active
 * - Read-only sharing: allow viewing but not using in projects
 *
 * Implementation approach for future:
 * - Add template_permissions table with (templateId, userId, permission_level)
 * - Add checkTemplatePermission(userId, templateId, action) middleware
 * - Support permission levels: owner, editor, viewer, user
 * - Maintain backward compatibility with role-based system
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { templates, templateVersions } from '@/lib/db/schema';
import { eq, and, like, desc, sql, or } from 'drizzle-orm';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { createTemplateSchema, listTemplatesQuerySchema } from '@/lib/validations/template';

/**
 * GET /api/templates
 * Returns list of templates for authenticated user's firm with filtering and pagination
 * SECURITY: Automatically filters by firmId from JWT
 * AC #1: Returns firm-filtered template list
 *
 * Query Parameters:
 * - search: Filter by template name or description
 * - isActive: Filter by active status (true/false)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const queryValidation = listTemplatesQuerySchema.safeParse({
      search: searchParams.get('search') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!queryValidation.success) {
      throw new ValidationError('Invalid query parameters', queryValidation.error.issues);
    }

    const { search, isActive, page, limit } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Build where conditions - CRITICAL: Always filter by firmId
    const conditions = [eq(templates.firmId, user.firmId)];

    // Filter by active status if specified
    if (isActive !== undefined) {
      conditions.push(eq(templates.isActive, isActive));
    }

    // Search by name or description
    if (search) {
      conditions.push(
        or(
          like(templates.name, `%${search}%`),
          like(templates.description, `%${search}%`)
        )!
      );
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .where(and(...conditions));

    // Get templates with creator information
    const firmTemplates = await db.query.templates.findMany({
      where: and(...conditions),
      orderBy: [desc(templates.updatedAt)],
      limit,
      offset,
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
      templates: firmTemplates,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/templates
 * Create a new template for the authenticated user's firm
 * AC #3: Creates template with validation
 * AC #7: Validates required fields and section types
 *
 * RBAC: Only admins and attorneys can create templates (AC from Story 3.9)
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req);

    // Require admin or attorney role
    requireRole(user, ['admin', 'attorney']);

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid template data', validationResult.error.issues);
    }

    const { name, description, sections, variables } = validationResult.data;

    // Create template with initial version
    const [template] = await db.transaction(async (tx) => {
      // Insert template
      const [newTemplate] = await tx.insert(templates).values({
        name,
        description: description || null,
        sections,
        variables,
        firmId: user.firmId,
        createdBy: user.userId,
        version: 1,
        isActive: true,
      }).returning();

      // Create initial version record
      await tx.insert(templateVersions).values({
        templateId: newTemplate.id,
        versionNumber: 1,
        structure: {
          sections: newTemplate.sections,
          variables: newTemplate.variables,
        },
        createdBy: user.userId,
      });

      return [newTemplate];
    });

    return NextResponse.json({
      template,
      message: 'Template created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Template creation error:', error);

    if (error instanceof ValidationError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    const errorResponse = createErrorResponse(new Error('Internal server error'));
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
