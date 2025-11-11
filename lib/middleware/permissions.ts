/**
 * Permission Middleware
 * Handles draft-level permission checks for API routes
 * Story 4.11: Document Locking and Permissions UI
 */

import { NextRequest } from 'next/server';
import { checkDraftPermission, PermissionLevel } from '../services/permission.service';
import { requireAuth, AuthenticatedUser } from './auth';
import { ForbiddenError, NotFoundError } from '../errors';

/**
 * Extended request with permission information
 */
export interface PermissionContext {
  user: AuthenticatedUser;
  draftId: string;
  permission: PermissionLevel;
  isOwner: boolean;
  canEdit: boolean;
  canComment: boolean;
  canView: boolean;
}

/**
 * Permission hierarchy helper
 * Determines if a user has at least the required permission level
 */
function hasMinimumPermission(
  userPermission: PermissionLevel | null,
  requiredPermission: 'view' | 'comment' | 'edit'
): boolean {
  if (!userPermission) {
    return false;
  }

  // Owner has all permissions
  if (userPermission === 'owner') {
    return true;
  }

  // Edit permission includes comment and view
  if (userPermission === 'edit') {
    return true;
  }

  // Comment permission includes view
  if (userPermission === 'comment') {
    return requiredPermission === 'view' || requiredPermission === 'comment';
  }

  // View permission only allows viewing
  if (userPermission === 'view') {
    return requiredPermission === 'view';
  }

  return false;
}


/**
 * Require specific draft permission level
 * This is the main middleware function used in API routes
 *
 * Usage:
 * ```typescript
 * export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
 *   const ctx = await requireDraftPermission(req, params.id, 'view');
 *   // ctx contains: user, draftId, permission, isOwner, canEdit, canComment, canView
 * }
 * ```
 *
 * @param request - Next.js request object
 * @param draftId - The draft ID (usually from route params)
 * @param minPermission - Minimum required permission level
 * @returns Permission context with user and permission information
 * @throws ForbiddenError if user lacks permission
 * @throws NotFoundError if draft not found or user has no access
 */
export async function requireDraftPermission(
  request: NextRequest,
  draftId: string,
  minPermission: 'view' | 'comment' | 'edit'
): Promise<PermissionContext> {
  // First, authenticate the user
  const user = await requireAuth(request);

  // Check the user's permission for this draft
  const permission = await checkDraftPermission(draftId, user.userId, user.firmId);

  // If no permission, return 404 (not 403) to avoid information disclosure
  if (!permission) {
    throw new NotFoundError('Draft not found');
  }

  // Check if user has minimum required permission
  if (!hasMinimumPermission(permission, minPermission)) {
    throw new ForbiddenError(`Insufficient permissions. Required: ${minPermission}`);
  }

  // Build permission context
  const isOwner = permission === 'owner';
  const canEdit = permission === 'owner' || permission === 'edit';
  const canComment = canEdit || permission === 'comment';
  const canView = canComment || permission === 'view';

  return {
    user,
    draftId,
    permission,
    isOwner,
    canEdit,
    canComment,
    canView,
  };
}

/**
 * Require owner permission for a draft
 * Used for operations that only the owner can perform (e.g., managing collaborators)
 *
 * @param request - Next.js request object
 * @param draftId - The draft ID
 * @returns Permission context
 * @throws ForbiddenError if user is not the owner
 */
export async function requireOwnerPermission(
  request: NextRequest,
  draftId: string
): Promise<PermissionContext> {
  const ctx = await requireDraftPermission(request, draftId, 'view');

  if (!ctx.isOwner) {
    throw new ForbiddenError('Only the draft owner can perform this action');
  }

  return ctx;
}

/**
 * Optional draft permission check
 * Returns permission context if user has access, null otherwise
 * Useful for routes that behave differently based on permission level
 *
 * @param request - Next.js request object
 * @param draftId - The draft ID
 * @returns Permission context or null
 */
export async function optionalDraftPermission(
  request: NextRequest,
  draftId: string
): Promise<PermissionContext | null> {
  try {
    const user = await requireAuth(request);
    const permission = await checkDraftPermission(draftId, user.userId, user.firmId);

    if (!permission) {
      return null;
    }

    const isOwner = permission === 'owner';
    const canEdit = permission === 'owner' || permission === 'edit';
    const canComment = canEdit || permission === 'comment';
    const canView = canComment || permission === 'view';

    return {
      user,
      draftId,
      permission,
      isOwner,
      canEdit,
      canComment,
      canView,
    };
  } catch {
    return null;
  }
}
