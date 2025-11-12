/**
 * Audit Middleware
 * Story 6.8 - Helper functions for audit logging in API routes
 *
 * Provides easy-to-use functions for logging audit events from API routes
 */

import { NextRequest } from 'next/server';
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '@/lib/services/audit.service';
import { AuthenticatedUser } from './auth';

/**
 * Extract metadata from request for audit logging
 * Captures IP address, user agent, HTTP method, and path
 */
export function extractAuditMetadata(req: NextRequest): {
  ipAddress?: string;
  userAgent?: string;
  method: string;
  path: string;
} {
  return {
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    method: req.method,
    path: req.nextUrl.pathname,
  };
}

/**
 * Log an audit event with automatic metadata extraction
 * Convenience wrapper around logAudit that automatically extracts request metadata
 *
 * @example
 * await auditLog(req, auth, {
 *   action: AUDIT_ACTIONS.DRAFT_VIEW,
 *   resourceType: RESOURCE_TYPES.DRAFT,
 *   resourceId: draftId,
 * });
 */
export async function auditLog(
  req: NextRequest,
  auth: AuthenticatedUser,
  params: {
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const requestMetadata = extractAuditMetadata(req);

  await logAudit({
    firmId: auth.firmId,
    userId: auth.userId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: {
      ...requestMetadata,
      ...params.metadata,
    },
  });
}

/**
 * Log successful authentication
 */
export async function auditAuthLogin(
  req: NextRequest,
  userId: string,
  firmId: string,
  email: string
): Promise<void> {
  const metadata = extractAuditMetadata(req);

  await logAudit({
    firmId,
    userId,
    action: AUDIT_ACTIONS.AUTH_LOGIN,
    metadata: {
      ...metadata,
      email,
    },
  });
}

/**
 * Log failed authentication attempt
 */
export async function auditAuthLoginFailed(
  req: NextRequest,
  email: string,
  reason: string
): Promise<void> {
  const metadata = extractAuditMetadata(req);

  // For failed login, we don't have a valid user/firm ID
  // Use a placeholder or system user ID if needed for compliance
  // For now, we'll skip logging failed attempts without valid IDs
  // This should be enhanced if firm-level failed login tracking is required
  console.log('Failed login attempt:', { email, reason, metadata });
}

/**
 * Log logout
 */
export async function auditAuthLogout(
  req: NextRequest,
  auth: AuthenticatedUser
): Promise<void> {
  await auditLog(req, auth, {
    action: AUDIT_ACTIONS.AUTH_LOGOUT,
  });
}

/**
 * Log document view
 */
export async function auditDocumentView(
  req: NextRequest,
  auth: AuthenticatedUser,
  documentId: string
): Promise<void> {
  await auditLog(req, auth, {
    action: AUDIT_ACTIONS.DOCUMENT_VIEW,
    resourceType: RESOURCE_TYPES.DOCUMENT,
    resourceId: documentId,
  });
}

/**
 * Log document download
 */
export async function auditDocumentDownload(
  req: NextRequest,
  auth: AuthenticatedUser,
  documentId: string,
  fileName?: string
): Promise<void> {
  await auditLog(req, auth, {
    action: AUDIT_ACTIONS.DOCUMENT_DOWNLOAD,
    resourceType: RESOURCE_TYPES.DOCUMENT,
    resourceId: documentId,
    metadata: fileName ? { fileName } : undefined,
  });
}

/**
 * Log export creation
 */
export async function auditExportCreate(
  req: NextRequest,
  auth: AuthenticatedUser,
  draftId: string,
  format: string
): Promise<void> {
  await auditLog(req, auth, {
    action: AUDIT_ACTIONS.EXPORT_CREATE,
    resourceType: RESOURCE_TYPES.EXPORT,
    resourceId: draftId,
    metadata: { format },
  });
}

/**
 * Log AI generation request
 */
export async function auditAIGenerate(
  req: NextRequest,
  auth: AuthenticatedUser,
  projectId: string,
  templateId?: string
): Promise<void> {
  await auditLog(req, auth, {
    action: AUDIT_ACTIONS.AI_GENERATE,
    resourceType: RESOURCE_TYPES.PROJECT,
    resourceId: projectId,
    metadata: templateId ? { templateId } : undefined,
  });
}

/**
 * Log AI refinement request
 */
export async function auditAIRefine(
  req: NextRequest,
  auth: AuthenticatedUser,
  draftId: string,
  instruction?: string
): Promise<void> {
  await auditLog(req, auth, {
    action: AUDIT_ACTIONS.AI_REFINE,
    resourceType: RESOURCE_TYPES.DRAFT,
    resourceId: draftId,
    metadata: instruction ? { instruction } : undefined,
  });
}

/**
 * Log user management actions (admin only)
 */
export async function auditUserAction(
  req: NextRequest,
  auth: AuthenticatedUser,
  action: string,
  targetUserId: string,
  changes?: Record<string, any>
): Promise<void> {
  await auditLog(req, auth, {
    action,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: targetUserId,
    metadata: changes ? { changes } : undefined,
  });
}

/**
 * Log template modifications
 */
export async function auditTemplateAction(
  req: NextRequest,
  auth: AuthenticatedUser,
  action: string,
  templateId: string,
  changes?: Record<string, any>
): Promise<void> {
  await auditLog(req, auth, {
    action,
    resourceType: RESOURCE_TYPES.TEMPLATE,
    resourceId: templateId,
    metadata: changes ? { changes } : undefined,
  });
}
