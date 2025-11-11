/**
 * Projects API - List all projects for user's firm with filtering and pagination
 * CRITICAL: All queries filtered by firmId for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { eq, and, like, desc, sql, or } from 'drizzle-orm';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Request body validation schema for creating a project
 */
const createProjectSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  variables: z.record(z.string(), z.any()),
  title: z.string().min(1, 'Title is required'),
  clientName: z.string().min(1, 'Client name is required'),
});

/**
 * POST /api/projects
 * Create a new demand letter project
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req);

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid request body', validationResult.error.issues);
    }

    const { templateId, variables, title, clientName } = validationResult.data;

    // Create project
    const [project] = await db.insert(projects).values({
      title,
      clientName,
      templateId,
      caseDetails: variables,
      firmId: user.firmId,
      createdBy: user.userId,
      status: 'draft',
    }).returning();

    return NextResponse.json({
      project,
      message: 'Project created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Project creation error:', error);

    if (error instanceof ValidationError) {
      const errorResponse = createErrorResponse(error);
      return NextResponse.json(errorResponse, { status: error.statusCode });
    }

    const errorResponse = createErrorResponse(new Error('Internal server error'));
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/projects
 * Returns all projects belonging to authenticated user's firm with filtering and pagination
 * SECURITY: Automatically filters by firmId from JWT
 * Query Parameters:
 * - status: Filter by project status (draft, in_review, completed, sent)
 * - search: Search by title or client name
 * - assignedTo: Filter by user who created the project
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    // Get query parameters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where conditions - CRITICAL: Always filter by firmId
    const conditions = [eq(projects.firmId, user.firmId)];

    if (status) {
      conditions.push(eq(projects.status, status as any));
    }

    if (assignedTo) {
      conditions.push(eq(projects.createdBy, assignedTo));
    }

    if (search) {
      conditions.push(
        or(
          like(projects.title, `%${search}%`),
          like(projects.clientName, `%${search}%`)
        )!
      );
    }

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(and(...conditions));

    // Get projects with relations
    const firmProjects = await db.query.projects.findMany({
      where: and(...conditions),
      orderBy: [desc(projects.updatedAt)],
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
        template: {
          columns: {
            id: true,
            name: true,
          }
        },
        draft: true,
      }
    });

    return NextResponse.json({
      projects: firmProjects,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorResponse = createErrorResponse(error as Error);
    const statusCode = (error as any).statusCode || 500;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
