/**
 * Firm Isolation Utilities
 * Ensures all database queries are filtered by firmId
 * CRITICAL: Returns 404 (not 403) for cross-firm access to prevent information disclosure
 */

import { eq, and, SQL } from 'drizzle-orm';
import { NotFoundError } from '../errors';
import { db } from '../db/client';

/**
 * Verify resource belongs to user's firm
 * Throws NotFoundError (404) if resource doesn't exist or belongs to different firm
 *
 * SECURITY: Returns 404 instead of 403 to avoid information disclosure
 *
 * Usage:
 * ```typescript
 * const project = await verifyFirmAccess(
 *   db.query.projects,
 *   projects,
 *   projectId,
 *   user.firmId,
 *   'Project'
 * );
 * ```
 */
export async function verifyFirmAccess<T extends { firmId: string; id: string }>(
  queryTable: any,
  table: any,
  resourceId: string,
  userFirmId: string,
  resourceName: string = 'Resource'
): Promise<T> {
  const resource = await queryTable.findFirst({
    where: and(
      eq(table.id, resourceId),
      eq(table.firmId, userFirmId)
    )
  });

  if (!resource) {
    // Return 404, not 403, to avoid information disclosure
    // Attacker shouldn't know if resource exists in different firm
    throw new NotFoundError(`${resourceName} not found`);
  }

  return resource as T;
}

/**
 * Create where clause with firm isolation
 * Combines custom where conditions with firmId filter
 *
 * Usage:
 * ```typescript
 * const projects = await db.query.projects.findMany({
 *   where: withFirmId(projects.firmId, user.firmId, additionalConditions)
 * });
 * ```
 */
export function withFirmId(
  firmIdColumn: any,
  userFirmId: string,
  additionalConditions?: SQL
): SQL {
  const firmCondition = eq(firmIdColumn, userFirmId);

  if (additionalConditions) {
    return and(firmCondition, additionalConditions) as SQL;
  }

  return firmCondition;
}

/**
 * Assert that a resource belongs to user's firm
 * Throws NotFoundError if firmId doesn't match
 *
 * Use this when you already have the resource loaded and need to verify access
 *
 * Usage:
 * ```typescript
 * const project = await getProject(projectId);
 * assertFirmAccess(project.firmId, user.firmId, 'Project');
 * ```
 */
export function assertFirmAccess(
  resourceFirmId: string,
  userFirmId: string,
  resourceName: string = 'Resource'
): void {
  if (resourceFirmId !== userFirmId) {
    // Return 404, not 403, to avoid information disclosure
    throw new NotFoundError(`${resourceName} not found`);
  }
}
