/**
 * Export Analytics API Route
 * GET /api/analytics/exports - Get export statistics (admin only)
 * Part of Story 5.10 - Export Version Tagging & Analytics
 * CRITICAL: Used by Story 6.13 (Admin Panel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getExportStats } from '@/lib/services/export-analytics.service';

/**
 * GET /api/analytics/exports
 * Get export statistics for firm (admin only)
 *
 * Returns:
 * - Total exports count
 * - Exports by format (DOCX, PDF)
 * - Exports by user
 * - Recent exports
 * - Average file size
 * - Exports by version
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only admins can access analytics
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Get export statistics for firm
    const stats = await getExportStats(auth.firmId);

    return NextResponse.json({
      analytics: stats,
    });
  } catch (error) {
    console.error('Error fetching export analytics:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch export analytics' } },
      { status: 500 }
    );
  }
}
