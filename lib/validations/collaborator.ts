/**
 * Validation schemas for collaborator management
 * Story 4.11: Document Locking and Permissions UI
 */

import { z } from 'zod';

/**
 * Permission level enum
 */
export const permissionLevelSchema = z.enum(['view', 'comment', 'edit']);

/**
 * Add collaborator request body
 */
export const addCollaboratorSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  permission: permissionLevelSchema,
});

/**
 * Update collaborator permission request body
 */
export const updateCollaboratorPermissionSchema = z.object({
  permission: permissionLevelSchema,
});

/**
 * Types inferred from schemas
 */
export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
export type UpdateCollaboratorPermissionInput = z.infer<typeof updateCollaboratorPermissionSchema>;
