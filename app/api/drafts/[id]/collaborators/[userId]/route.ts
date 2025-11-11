/**
 * Individual Collaborator API Route
 * Handles updating and removing specific collaborators
 * Story 4.11: Document Locking and Permissions UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerPermission } from '@/lib/middleware/permissions';
import {
  updateCollaboratorPermission,
  removeCollaborator,
  getCollaborators
} from '@/lib/services/permission.service';
import { updateCollaboratorPermissionSchema } from '@/lib/validations/collaborator';
import { createErrorResponse } from '@/lib/errors';
import { z } from 'zod';

/**
 * PATCH /api/drafts/:id/collaborators/:userId
 * Update a collaborator's permission level
 * Requires: owner permission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const draftId = params.id;
    const userId = params.userId;

    // Require owner permission to update collaborator permissions
    const ctx = await requireOwnerPermission(request, draftId);

    // Parse and validate request body
    const body = await request.json();
    const data = updateCollaboratorPermissionSchema.parse(body);

    // Update the collaborator's permission
    await updateCollaboratorPermission(
      draftId,
      userId,
      data.permission,
      ctx.user.userId,
      ctx.user.firmId
    );

    // Return updated list of collaborators
    const collaborators = await getCollaborators(draftId, ctx.user.firmId);

    return NextResponse.json({
      message: 'Collaborator permission updated successfully',
      collaborators
    });
  } catch (error) {
    console.error('Error updating collaborator permission:', error);

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

/**
 * DELETE /api/drafts/:id/collaborators/:userId
 * Remove a collaborator from a draft
 * Requires: owner permission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const draftId = params.id;
    const userId = params.userId;

    // Require owner permission to remove collaborators
    const ctx = await requireOwnerPermission(request, draftId);

    // Remove the collaborator
    await removeCollaborator(
      draftId,
      userId,
      ctx.user.userId,
      ctx.user.firmId
    );

    // Return updated list of collaborators
    const collaborators = await getCollaborators(draftId, ctx.user.firmId);

    return NextResponse.json({
      message: 'Collaborator removed successfully',
      collaborators
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);

    const err = error as Error & { statusCode?: number };
    return NextResponse.json(
      createErrorResponse(err),
      { status: err.statusCode || 500 }
    );
  }
}
