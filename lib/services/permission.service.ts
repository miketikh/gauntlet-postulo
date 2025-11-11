/**
 * Permission Service
 * Handles document permissions and collaborator management
 * Enforces firm-level isolation for security
 * Story 4.11: Document Locking and Permissions UI
 */

import { db } from '../db/client';
import { draftCollaborators, drafts, projects, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError, ForbiddenError } from '../errors';

/**
 * Permission levels hierarchy:
 * - owner: Draft creator, full access, cannot be removed, can manage collaborators
 * - edit: Can modify document content, add/resolve comments, view history
 * - comment: Can add comments, view document, cannot edit content
 * - view: Can only view document, no editing or commenting
 */
export type PermissionLevel = 'view' | 'comment' | 'edit' | 'owner';

/**
 * Collaborator information with user details
 */
export interface Collaborator {
  id: string;
  userId: string;
  permission: 'view' | 'comment' | 'edit';
  invitedBy: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Check user's permission level for a draft
 * Returns the highest permission level the user has
 * Enforces firm isolation - only users in same firm can access
 *
 * @param draftId - The draft ID to check
 * @param userId - The user ID to check permission for
 * @param firmId - The user's firm ID (for isolation)
 * @returns Permission level or null if no access
 */
export async function checkDraftPermission(
  draftId: string,
  userId: string,
  firmId: string
): Promise<PermissionLevel | null> {
  // Get draft with project information to verify firm isolation
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    with: {
      project: {
        with: {
          creator: true,
        },
      },
    },
  });

  if (!draft || !draft.project) {
    return null;
  }

  // Enforce firm isolation - return null (not found) for cross-firm access
  if (draft.project.firmId !== firmId) {
    return null;
  }

  // Check if user is the owner (project creator)
  if (draft.project.createdBy === userId) {
    return 'owner';
  }

  // Check collaborator permissions
  const collaborator = await db.query.draftCollaborators.findFirst({
    where: and(
      eq(draftCollaborators.draftId, draftId),
      eq(draftCollaborators.userId, userId)
    ),
  });

  return collaborator ? collaborator.permission : null;
}

/**
 * Get the draft owner's user ID
 * Verifies firm isolation
 *
 * @param draftId - The draft ID
 * @param firmId - The requesting user's firm ID
 * @returns Owner user ID
 * @throws NotFoundError if draft not found or not in firm
 */
export async function getDraftOwner(
  draftId: string,
  firmId: string
): Promise<string> {
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    with: {
      project: true,
    },
  });

  if (!draft || !draft.project) {
    throw new NotFoundError('Draft not found');
  }

  // Enforce firm isolation
  if (draft.project.firmId !== firmId) {
    throw new NotFoundError('Draft not found');
  }

  return draft.project.createdBy;
}

/**
 * Add a collaborator to a draft
 * Only the owner can add collaborators
 * Cannot add users from other firms
 *
 * @param draftId - The draft ID
 * @param userId - The user ID to add as collaborator
 * @param permission - The permission level to grant
 * @param invitedBy - The user ID of who is adding the collaborator
 * @param firmId - The firm ID for isolation
 * @throws ForbiddenError if invitedBy is not the owner
 * @throws NotFoundError if draft or user not found
 * @throws Error if user is from different firm
 */
export async function addCollaborator(
  draftId: string,
  userId: string,
  permission: 'view' | 'comment' | 'edit',
  invitedBy: string,
  firmId: string
): Promise<void> {
  // Verify the inviter is the owner
  const ownerId = await getDraftOwner(draftId, firmId);
  if (ownerId !== invitedBy) {
    throw new ForbiddenError('Only the draft owner can add collaborators');
  }

  // Verify the user exists and is in the same firm
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.firmId !== firmId) {
    throw new ForbiddenError('Cannot add users from other firms');
  }

  // Check if user is already the owner
  if (userId === ownerId) {
    throw new Error('User is already the owner of this draft');
  }

  // Insert or update collaborator
  await db
    .insert(draftCollaborators)
    .values({
      draftId,
      userId,
      permission,
      invitedBy,
    })
    .onConflictDoUpdate({
      target: [draftCollaborators.draftId, draftCollaborators.userId],
      set: {
        permission,
        updatedAt: new Date(),
      },
    });
}

/**
 * Update a collaborator's permission level
 * Only the owner can update permissions
 *
 * @param draftId - The draft ID
 * @param userId - The user ID to update
 * @param permission - The new permission level
 * @param requestingUserId - The user ID making the request
 * @param firmId - The firm ID for isolation
 * @throws ForbiddenError if requesting user is not the owner
 * @throws NotFoundError if collaborator not found
 */
export async function updateCollaboratorPermission(
  draftId: string,
  userId: string,
  permission: 'view' | 'comment' | 'edit',
  requestingUserId: string,
  firmId: string
): Promise<void> {
  // Verify the requester is the owner
  const ownerId = await getDraftOwner(draftId, firmId);
  if (ownerId !== requestingUserId) {
    throw new ForbiddenError('Only the draft owner can update permissions');
  }

  // Cannot update owner's permission
  if (userId === ownerId) {
    throw new ForbiddenError('Cannot modify owner permissions');
  }

  // Update the collaborator
  const result = await db
    .update(draftCollaborators)
    .set({
      permission,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(draftCollaborators.draftId, draftId),
        eq(draftCollaborators.userId, userId)
      )
    )
    .returning();

  if (result.length === 0) {
    throw new NotFoundError('Collaborator not found');
  }
}

/**
 * Remove a collaborator from a draft
 * Only the owner can remove collaborators
 * Cannot remove the owner
 *
 * @param draftId - The draft ID
 * @param userId - The user ID to remove
 * @param requestingUserId - The user ID making the request
 * @param firmId - The firm ID for isolation
 * @throws ForbiddenError if requesting user is not the owner
 * @throws Error if trying to remove the owner
 */
export async function removeCollaborator(
  draftId: string,
  userId: string,
  requestingUserId: string,
  firmId: string
): Promise<void> {
  // Verify the requester is the owner
  const ownerId = await getDraftOwner(draftId, firmId);
  if (ownerId !== requestingUserId) {
    throw new ForbiddenError('Only the draft owner can remove collaborators');
  }

  // Cannot remove the owner
  if (userId === ownerId) {
    throw new Error('Cannot remove the draft owner');
  }

  // Delete the collaborator
  await db
    .delete(draftCollaborators)
    .where(
      and(
        eq(draftCollaborators.draftId, draftId),
        eq(draftCollaborators.userId, userId)
      )
    );
}

/**
 * Get all collaborators for a draft
 * Includes user details but not passwords
 * Verifies firm isolation
 *
 * @param draftId - The draft ID
 * @param firmId - The firm ID for isolation
 * @returns Array of collaborators with user details
 * @throws NotFoundError if draft not found or not in firm
 */
export async function getCollaborators(
  draftId: string,
  firmId: string
): Promise<Collaborator[]> {
  // Verify draft exists and belongs to firm
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    with: {
      project: true,
    },
  });

  if (!draft || !draft.project) {
    throw new NotFoundError('Draft not found');
  }

  // Enforce firm isolation
  if (draft.project.firmId !== firmId) {
    throw new NotFoundError('Draft not found');
  }

  // Get all collaborators with user details
  const collaborators = await db.query.draftCollaborators.findMany({
    where: eq(draftCollaborators.draftId, draftId),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return collaborators.map(c => ({
    id: c.id,
    userId: c.userId,
    permission: c.permission,
    invitedBy: c.invitedBy,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    user: c.user,
  }));
}

/**
 * Get owner information for a draft
 * Returns owner user details
 *
 * @param draftId - The draft ID
 * @param firmId - The firm ID for isolation
 * @returns Owner user information
 * @throws NotFoundError if draft not found
 */
export async function getOwnerInfo(
  draftId: string,
  firmId: string
): Promise<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}> {
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    with: {
      project: {
        with: {
          creator: {
            columns: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!draft || !draft.project) {
    throw new NotFoundError('Draft not found');
  }

  // Enforce firm isolation
  if (draft.project.firmId !== firmId) {
    throw new NotFoundError('Draft not found');
  }

  return draft.project.creator;
}
