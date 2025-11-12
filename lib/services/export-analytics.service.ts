/**
 * Export Analytics Service
 * Provides analytics and statistics for document exports
 * Part of Story 5.10 - Export Version Tagging & Analytics
 */

import { db } from '../db/client';
import { draftExports, users } from '../db/schema';
import { eq, sql, and, desc, count } from 'drizzle-orm';

export interface ExportStats {
  totalExports: number;
  exportsByFormat: {
    docx: number;
    pdf: number;
  };
  exportsByUser: Array<{
    userId: string;
    name: string;
    email: string;
    count: number;
  }>;
  recentExports: Array<{
    id: string;
    fileName: string;
    format: string;
    version: number;
    fileSize: number;
    exportedAt: Date;
    exportedBy: {
      id: string;
      name: string;
      email: string;
    };
    metadata: any;
  }>;
  averageFileSize: number;
  exportsByVersion: Array<{
    version: number;
    count: number;
  }>;
}

/**
 * Get export statistics for a firm
 * Used by Story 6.13 (Admin Panel)
 */
export async function getExportStats(firmId: string): Promise<ExportStats> {
  // Get all exports for the firm
  const exports = await db.query.draftExports.findMany({
    with: {
      draft: {
        with: {
          project: {
            columns: {
              firmId: true,
            },
          },
        },
      },
      exporter: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: desc(draftExports.createdAt),
  });

  // Filter by firmId
  const firmExports = exports.filter((exp) => exp.draft.project.firmId === firmId);

  // Calculate total exports
  const totalExports = firmExports.length;

  // Calculate exports by format
  const exportsByFormat = {
    docx: firmExports.filter((exp) => exp.format === 'docx').length,
    pdf: firmExports.filter((exp) => exp.format === 'pdf').length,
  };

  // Calculate exports by user
  const userExportCounts = firmExports.reduce((acc, exp) => {
    const userId = exp.exportedBy;
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        name: `${exp.exporter.firstName} ${exp.exporter.lastName}`,
        email: exp.exporter.email,
        count: 0,
      };
    }
    acc[userId].count++;
    return acc;
  }, {} as Record<string, { userId: string; name: string; email: string; count: number }>);

  const exportsByUser = Object.values(userExportCounts).sort((a, b) => b.count - a.count);

  // Get recent exports (last 10)
  const recentExports = firmExports.slice(0, 10).map((exp) => ({
    id: exp.id,
    fileName: exp.fileName,
    format: exp.format,
    version: exp.version,
    fileSize: exp.fileSize || 0,
    exportedAt: exp.createdAt,
    exportedBy: {
      id: exp.exporter.id,
      name: `${exp.exporter.firstName} ${exp.exporter.lastName}`,
      email: exp.exporter.email,
    },
    metadata: exp.metadata,
  }));

  // Calculate average file size
  const totalSize = firmExports.reduce((sum, exp) => sum + (exp.fileSize || 0), 0);
  const averageFileSize = totalExports > 0 ? Math.round(totalSize / totalExports) : 0;

  // Calculate exports by version
  const versionCounts = firmExports.reduce((acc, exp) => {
    const version = exp.version;
    if (!acc[version]) {
      acc[version] = 0;
    }
    acc[version]++;
    return acc;
  }, {} as Record<number, number>);

  const exportsByVersion = Object.entries(versionCounts)
    .map(([version, count]) => ({
      version: parseInt(version),
      count,
    }))
    .sort((a, b) => a.version - b.version);

  return {
    totalExports,
    exportsByFormat,
    exportsByUser,
    recentExports,
    averageFileSize,
    exportsByVersion,
  };
}

/**
 * Get export history for a specific draft
 * Returns all exports for a draft, ordered by creation date
 */
export async function getDraftExportHistory(draftId: string) {
  const exports = await db.query.draftExports.findMany({
    where: eq(draftExports.draftId, draftId),
    with: {
      exporter: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: desc(draftExports.createdAt),
  });

  return exports.map((exp) => ({
    id: exp.id,
    fileName: exp.fileName,
    format: exp.format,
    version: exp.version,
    fileSize: exp.fileSize,
    exportedAt: exp.createdAt,
    exportedBy: {
      id: exp.exporter.id,
      name: `${exp.exporter.firstName} ${exp.exporter.lastName}`,
      email: exp.exporter.email,
    },
    metadata: exp.metadata,
    s3Key: exp.s3Key,
  }));
}

/**
 * Get export count by date range
 * Useful for charts and trends
 */
export async function getExportCountByDateRange(
  firmId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const exports = await db.query.draftExports.findMany({
    with: {
      draft: {
        with: {
          project: {
            columns: {
              firmId: true,
            },
          },
        },
      },
    },
  });

  const firmExports = exports.filter(
    (exp) =>
      exp.draft.project.firmId === firmId &&
      exp.createdAt >= startDate &&
      exp.createdAt <= endDate
  );

  return firmExports.length;
}
