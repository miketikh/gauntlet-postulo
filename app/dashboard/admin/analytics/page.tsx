'use client';

/**
 * Admin Analytics Page
 * Detailed analytics with charts and visualizations
 * Story 6.13 - Admin Panel Dashboard
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  totalProjects: number;
  projectsThisMonth: number;
  activeUsers: number;
  totalDocuments: number;
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

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!accessToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/api/admin/analytics');
        setAnalytics(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
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

  if (!analytics) {
    return null;
  }

  // Prepare data for export format pie chart
  const exportFormatData = [
    { name: 'DOCX', value: analytics.exportStats.exportsByFormat.docx },
    { name: 'PDF', value: analytics.exportStats.exportsByFormat.pdf },
  ];

  // Prepare data for top users bar chart
  const topUsers = analytics.userActivity
    .slice(0, 5)
    .map((user) => ({
      name: user.name,
      projects: user.projectsCreated,
      documents: user.documentsUploaded,
    }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-slate-700" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usage Analytics</h1>
          <p className="text-slate-600">Detailed insights into firm activity</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Projects Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Projects Created Over Time</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.projectsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.projectsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Projects" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>Most active users by projects created</CardDescription>
            </CardHeader>
            <CardContent>
              {topUsers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="projects" fill="#8b5cf6" name="Projects" />
                    <Bar dataKey="documents" fill="#06b6d4" name="Documents" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-slate-500 py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Details</CardTitle>
              <CardDescription>{analytics.userActivity.length} users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Projects</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Documents</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.userActivity.map((user) => (
                      <tr
                        key={user.userId}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{user.name}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{user.email}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-medium text-sm">
                            {user.projectsCreated}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 font-medium text-sm">
                            {user.documentsUploaded}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {user.lastActive
                            ? new Date(user.lastActive).toLocaleDateString()
                            : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Format Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Exports by Format</CardTitle>
                <CardDescription>
                  {analytics.exportStats.totalExports} total exports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.exportStats.totalExports > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={exportFormatData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {exportFormatData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-8">No exports yet</p>
                )}
              </CardContent>
            </Card>

            {/* Export Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Export Statistics</CardTitle>
                <CardDescription>Summary of export activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Exports</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {analytics.exportStats.totalExports}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">DOCX Format</span>
                    <span className="text-lg font-semibold text-purple-700">
                      {analytics.exportStats.exportsByFormat.docx}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">PDF Format</span>
                    <span className="text-lg font-semibold text-cyan-700">
                      {analytics.exportStats.exportsByFormat.pdf}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Average File Size</span>
                    <span className="text-lg font-semibold text-slate-700">
                      {(analytics.exportStats.averageFileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Exports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Exports</CardTitle>
              <CardDescription>Last 10 exports</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.exportStats.recentExports && analytics.exportStats.recentExports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">File Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Format</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Exported By</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.exportStats.recentExports.map((exp: any) => (
                        <tr
                          key={exp.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{exp.fileName}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 uppercase">
                              {exp.format}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{exp.exportedBy.name}</td>
                          <td className="py-3 px-4 text-slate-600 text-sm">
                            {new Date(exp.exportedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 text-sm">
                            {(exp.fileSize / 1024).toFixed(1)} KB
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No recent exports</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
