/**
 * Audit Logging Service
 * Story 6.8 - Implement Audit Logging for Compliance
 *
 * Tracks critical user actions for legal compliance (7-year retention requirement).
 * Logs are immutable (append-only) and indexed for efficient querying.
 */

import { db } from '@/lib/db/client';
import { auditLogs, type NewAuditLog } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, or } from 'drizzle-orm';

/**
 * Action types for audit logging
 * Format: <resource>.<action>
 */
export const AUDIT_ACTIONS = {
  // Authentication
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REFRESH: 'auth.refresh',

  // Projects
  PROJECT_CREATE: 'project.create',
  PROJECT_VIEW: 'project.view',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',

  // Drafts
  DRAFT_CREATE: 'draft.create',
  DRAFT_VIEW: 'draft.view',
  DRAFT_UPDATE: 'draft.update',
  DRAFT_DELETE: 'draft.delete',

  // Documents
  DOCUMENT_UPLOAD: 'document.upload',
  DOCUMENT_VIEW: 'document.view',
  DOCUMENT_DOWNLOAD: 'document.download',
  DOCUMENT_DELETE: 'document.delete',

  // AI Generation
  AI_GENERATE: 'ai.generate',
  AI_REFINE: 'ai.refine',

  // Export
  EXPORT_CREATE: 'export.create',
  EXPORT_DOWNLOAD: 'export.download',
  EXPORT_EMAIL: 'export.email',

  // Templates
  TEMPLATE_CREATE: 'template.create',
  TEMPLATE_VIEW: 'template.view',
  TEMPLATE_UPDATE: 'template.update',
  TEMPLATE_DELETE: 'template.delete',

  // Collaboration
  COLLABORATOR_ADD: 'collaborator.add',
  COLLABORATOR_REMOVE: 'collaborator.remove',
  COLLABORATOR_UPDATE: 'collaborator.update',

  // Comments
  COMMENT_CREATE: 'comment.create',
  COMMENT_UPDATE: 'comment.update',
  COMMENT_DELETE: 'comment.delete',
  COMMENT_RESOLVE: 'comment.resolve',

  // Users (Admin only)
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_DEACTIVATE: 'user.deactivate',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

/**
 * Resource types for audit logging
 */
export const RESOURCE_TYPES = {
  PROJECT: 'project',
  DRAFT: 'draft',
  DOCUMENT: 'document',
  TEMPLATE: 'template',
  USER: 'user',
  EXPORT: 'export',
  COMMENT: 'comment',
  COLLABORATOR: 'collaborator',
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];

/**
 * Log an audit event
 * This is the primary function for creating audit logs throughout the application
 *
 * @example
 * await logAudit({
 *   firmId: user.firmId,
 *   userId: user.id,
 *   action: AUDIT_ACTIONS.DRAFT_VIEW,
 *   resourceType: RESOURCE_TYPES.DRAFT,
 *   resourceId: draftId,
 *   metadata: {
 *     ipAddress: req.headers.get('x-forwarded-for'),
 *     userAgent: req.headers.get('user-agent'),
 *   }
 * });
 */
export async function logAudit(params: {
  firmId: string;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    changes?: Record<string, any>;
    error?: string;
    duration?: number;
    [key: string]: any;
  };
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      firmId: params.firmId,
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: params.metadata,
      createdAt: new Date(),
    });
  } catch (error) {
    // Audit logging should never break the application
    // Log error but don't throw
    console.error('Failed to write audit log:', error, params);
  }
}

/**
 * Query audit logs with filters
 * Used by admin panel for compliance reporting
 *
 * @example
 * const logs = await getAuditLogs(firmId, {
 *   userId: 'user-123',
 *   action: AUDIT_ACTIONS.DRAFT_VIEW,
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31'),
 *   limit: 100,
 *   offset: 0,
 * });
 */
export async function getAuditLogs(
  firmId: string,
  filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const conditions = [eq(auditLogs.firmId, firmId)];

  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }

  if (filters?.resourceType) {
    conditions.push(eq(auditLogs.resourceType, filters.resourceType));
  }

  if (filters?.resourceId) {
    conditions.push(eq(auditLogs.resourceId, filters.resourceId));
  }

  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate));
  }

  const query = db.query.auditLogs.findMany({
    where: and(...conditions),
    orderBy: desc(auditLogs.createdAt),
    limit: filters?.limit || 100,
    offset: filters?.offset || 0,
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        }
      }
    }
  });

  const logs = await query;

  return logs;
}

/**
 * Get audit log count for a firm (with optional filters)
 * Used for pagination
 */
export async function getAuditLogCount(
  firmId: string,
  filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<number> {
  const conditions = [eq(auditLogs.firmId, firmId)];

  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }

  if (filters?.resourceType) {
    conditions.push(eq(auditLogs.resourceType, filters.resourceType));
  }

  if (filters?.resourceId) {
    conditions.push(eq(auditLogs.resourceId, filters.resourceId));
  }

  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate));
  }

  const result = await db
    .select()
    .from(auditLogs)
    .where(and(...conditions));

  return result.length;
}

/**
 * Get recent audit activity for a specific resource
 * Useful for showing "Recent Activity" in UI
 */
export async function getResourceAuditHistory(
  firmId: string,
  resourceType: string,
  resourceId: string,
  limit: number = 20
) {
  return getAuditLogs(firmId, {
    resourceType,
    resourceId,
    limit,
  });
}

/**
 * Get user activity summary
 * Shows what actions a specific user has performed
 */
export async function getUserAuditActivity(
  firmId: string,
  userId: string,
  limit: number = 50
) {
  return getAuditLogs(firmId, {
    userId,
    limit,
  });
}
