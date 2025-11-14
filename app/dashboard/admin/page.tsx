'use client';

/**
 * Admin Dashboard Page (Overview/Analytics)
 * Main landing page for admin panel showing key metrics
 * Story 6.13 - Admin Panel Dashboard
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Users, Upload, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface DashboardStats {
  totalProjects: number;
  projectsThisMonth: number;
  activeUsers: number;
  totalDocuments: number;
  totalDrafts: number;
  exportStats: {
    totalExports: number;
    exportsByFormat: {
      docx: number;
      pdf: number;
    };
  };
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!accessToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/api/admin/analytics');
        setStats(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Overview of your firm's activity</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-slate-500">
              {stats.projectsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-slate-500">
              Registered users in firm
            </p>
          </CardContent>
        </Card>

        {/* Total Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Uploaded</CardTitle>
            <Upload className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-slate-500">
              Source documents
            </p>
          </CardContent>
        </Card>

        {/* Total Exports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.exportStats.totalExports}</div>
            <p className="text-xs text-slate-500">
              {stats.exportStats.exportsByFormat.docx} DOCX, {stats.exportStats.exportsByFormat.pdf} PDF
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/admin/users"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Users className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-slate-900">Manage Users</h3>
              <p className="text-sm text-slate-500">Add, edit, or deactivate users</p>
            </a>

            <a
              href="/dashboard/admin/settings"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FileText className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-slate-900">Firm Settings</h3>
              <p className="text-sm text-slate-500">Update letterhead and preferences</p>
            </a>

            <a
              href="/dashboard/admin/analytics"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-slate-900">View Analytics</h3>
              <p className="text-sm text-slate-500">Detailed usage statistics</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
