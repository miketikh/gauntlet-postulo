/**
 * Admin Analytics API Route
 * GET /api/admin/analytics - Get firm analytics (admin only)
 * Story 6.13 - Admin Panel Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { projects, users, drafts, sourceDocuments, draftExports } from '@/lib/db/schema';
import { eq, and, gte, countDistinct, count, sql } from 'drizzle-orm';
import { startOfMonth, subDays } from 'date-fns';
import { getExportStats } from '@/lib/services/export-analytics.service';

interface AnalyticsResponse {
  totalProjects: number;
  projectsThisMonth: number;
  activeUsers: number;
  totalDocuments: number;
  totalDrafts: number;
  exportStats: any;
  projectsOverTime: Array<{ date: string; count: number }>;
  userActivity: Array<{
    userId: string;
    name: string;
    email: string;
    projectsCreated: number;
    documentsUploaded: number;
    lastActive: Date | null;
  }>;
}

/**
 * GET /api/admin/analytics
 * Returns comprehensive analytics for the firm
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    requireRole(auth, ['admin']);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = subDays(now, 30);

    // Total projects count
    const totalProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.firmId, auth.firmId));
    const totalProjects = totalProjectsResult[0]?.count || 0;

    // Projects this month
    const projectsThisMonthResult = await db
      .select({ count: count() })
      .from(projects)
      .where(
        and(
          eq(projects.firmId, auth.firmId),
          gte(projects.createdAt, monthStart)
        )
      );
    const projectsThisMonth = projectsThisMonthResult[0]?.count || 0;

    // Active users (active = true)
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.firmId, auth.firmId),
          eq(users.active, true)
        )
      );
    const activeUsers = activeUsersResult[0]?.count || 0;

    // Total documents
    const totalDocumentsResult = await db
      .select({ count: count() })
      .from(sourceDocuments)
      .innerJoin(projects, eq(sourceDocuments.projectId, projects.id))
      .where(eq(projects.firmId, auth.firmId));
    const totalDocuments = totalDocumentsResult[0]?.count || 0;

    // Total drafts
    const totalDraftsResult = await db
      .select({ count: count() })
      .from(drafts)
      .innerJoin(projects, eq(drafts.projectId, projects.id))
      .where(eq(projects.firmId, auth.firmId));
    const totalDrafts = totalDraftsResult[0]?.count || 0;

    // Get export statistics from Story 5.10
    const exportStats = await getExportStats(auth.firmId);

    // Projects over time (last 30 days)
    const allProjects = await db.query.projects.findMany({
      where: eq(projects.firmId, auth.firmId),
      columns: {
        id: true,
        createdAt: true,
      },
    });

    // Group by date
    const projectsByDate = allProjects.reduce((acc, project) => {
      const date = project.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const projectsOverTime = Object.entries(projectsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    // User activity
    const firmUsers = await db.query.users.findMany({
      where: eq(users.firmId, auth.firmId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        active: true,
      },
    });

    const userActivityPromises = firmUsers.map(async (user) => {
      const projectsCreatedResult = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.createdBy, user.id));
      const projectsCreated = projectsCreatedResult[0]?.count || 0;

      const documentsUploadedResult = await db
        .select({ count: count() })
        .from(sourceDocuments)
        .where(eq(sourceDocuments.uploadedBy, user.id));
      const documentsUploaded = documentsUploadedResult[0]?.count || 0;

      // Get most recent activity
      const recentProjects = await db.query.projects.findMany({
        where: eq(projects.createdBy, user.id),
        orderBy: (projects, { desc }) => [desc(projects.createdAt)],
        limit: 1,
      });
      const lastActive = recentProjects[0]?.createdAt || null;

      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        projectsCreated,
        documentsUploaded,
        lastActive,
      };
    });

    const userActivity = await Promise.all(userActivityPromises);
    userActivity.sort((a, b) => b.projectsCreated - a.projectsCreated);

    const response: AnalyticsResponse = {
      totalProjects,
      projectsThisMonth,
      activeUsers,
      totalDocuments,
      totalDrafts,
      exportStats,
      projectsOverTime,
      userActivity,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch analytics',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
