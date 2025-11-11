/**
 * Collaborators API Route
 * Handles listing and adding collaborators to drafts
 * Story 4.11: Document Locking and Permissions UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireDraftPermission, requireOwnerPermission } from '@/lib/middleware/permissions';
import {
  getCollaborators,
  addCollaborator,
  getOwnerInfo
} from '@/lib/services/permission.service';
import { addCollaboratorSchema } from '@/lib/validations/collaborator';
import { createErrorResponse } from '@/lib/errors';
import { z } from 'zod';

/**
 * GET /api/drafts/:id/collaborators
 * List all collaborators for a draft
 * Requires: 'view' permission
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = params.id;

    // Require view permission to see collaborators
    const ctx = await requireDraftPermission(request, draftId, 'view');

    // Get all collaborators
    const collaborators = await getCollaborators(draftId, ctx.user.firmId);

    // Get owner information
    const owner = await getOwnerInfo(draftId, ctx.user.firmId);

    return NextResponse.json({
      owner: {
        ...owner,
        permission: 'owner' as const,
        isOwner: true,
      },
      collaborators,
      currentUserPermission: ctx.permission,
    });
  } catch (error) {
    console.error('Error listing collaborators:', error);
    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      createErrorResponse(err),
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * POST /api/drafts/:id/collaborators
 * Add a new collaborator to a draft
 * Requires: owner permission
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = params.id;

    // Require owner permission to add collaborators
    const ctx = await requireOwnerPermission(request, draftId);

    // Parse and validate request body
    const body = await request.json();
    const data = addCollaboratorSchema.parse(body);

    // Add the collaborator
    await addCollaborator(
      draftId,
      data.userId,
      data.permission,
      ctx.user.userId,
      ctx.user.firmId
    );

    // Return updated list of collaborators
    const collaborators = await getCollaborators(draftId, ctx.user.firmId);

    return NextResponse.json(
      {
        message: 'Collaborator added successfully',
        collaborators
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding collaborator:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
            timestamp: new Date().toISOString(),
          }
        },
        { status: 400 }
      );
    }

    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      createErrorResponse(err),
      { status: err.statusCode || 500 }
    );
  }
}
