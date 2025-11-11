/**
 * Templates API Endpoint - Single Template
 * GET /api/templates/[id] - Get template by ID
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { templates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse, NotFoundError } from '@/lib/errors';

/**
 * GET /api/templates/[id]
 * Get a specific template by ID
 * SECURITY: Returns only templates belonging to user's firm
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await requireAuth(req);

    // Fetch template by ID
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, params.id),
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Security check: Ensure template belongs to user's firm
    if (template.firmId !== user.firmId) {
      throw new NotFoundError('Template not found');
    }

    return Response.json({
      template,
    });

  } catch (error) {
    console.error('Template fetch error:', error);

    if (error instanceof NotFoundError) {
      const errorResponse = createErrorResponse(error);
      return Response.json(errorResponse, { status: error.statusCode });
    }

    const errorResponse = createErrorResponse(new Error('Internal server error'));
    return Response.json(errorResponse, { status: 500 });
  }
}
