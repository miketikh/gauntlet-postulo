/**
 * Audit Logs API
 * Story 6.8 - Admin endpoint for viewing audit logs
 *
 * GET /api/audit-logs - List audit logs with filters (admin only)
 * Supports pagination, filtering by user, action, date range, resource type
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { getAuditLogs, getAuditLogCount } from '@/lib/services/audit.service';
import { z } from 'zod';

/**
 * Query parameter schema for audit log filtering
 */
const auditLogsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/audit-logs
 * Retrieve audit logs for the firm (admin only)
 *
 * Query parameters:
 * - userId: Filter by user ID
 * - action: Filter by action type (e.g., 'draft.view')
 * - resourceType: Filter by resource type (e.g., 'draft')
 * - resourceId: Filter by specific resource ID
 * - startDate: ISO 8601 datetime (inclusive)
 * - endDate: ISO 8601 datetime (inclusive)
 * - limit: Number of results per page (default: 100, max: 1000)
 * - offset: Pagination offset (default: 0)
 *
 * Response:
 * {
 *   logs: AuditLog[],
 *   total: number,
 *   limit: number,
 *   offset: number
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    // Only admins can view audit logs
    requireRole(auth, ['admin']);

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      resourceId: searchParams.get('resourceId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    const validated = auditLogsQuerySchema.parse(queryParams);

    // Convert date strings to Date objects if provided
    const filters = {
      userId: validated.userId,
      action: validated.action,
      resourceType: validated.resourceType,
      resourceId: validated.resourceId,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      limit: validated.limit,
      offset: validated.offset,
    };

    // Get audit logs and total count
    const [logs, total] = await Promise.all([
      getAuditLogs(auth.firmId, filters),
      getAuditLogCount(auth.firmId, {
        userId: filters.userId,
        action: filters.action,
        resourceType: filters.resourceType,
        resourceId: filters.resourceId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
    ]);

    return NextResponse.json({
      logs,
      total,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch audit logs',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
