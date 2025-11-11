'use client';

/**
 * Admin Users Page
 * Displays list of all users in the firm (admin only)
 * Based on architecture.md RBAC patterns
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'attorney' | 'paralegal';
  firmId: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  count: number;
}

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      if (!accessToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access denied - admin role required');
          }
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const data: UsersResponse = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [accessToken]);

  // Role badge color helper
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'attorney':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paralegal':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-slate-700" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-600">Manage users in your firm</p>
          </div>
        </div>

        {/* Users List Card */}
        <Card>
          <CardHeader>
            <CardTitle>Firm Users</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${users.length} total users`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {!loading && !error && users.length === 0 && (
              <p className="text-center text-slate-500 py-8">No users found</p>
            )}

            {!loading && !error && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
