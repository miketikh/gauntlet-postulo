'use client';

/**
 * ProtectedRoute Component
 * Conditional rendering based on user role
 * Based on architecture.md RBAC patterns
 */

import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'attorney' | 'paralegal'>;
  fallback?: React.ReactNode;
}

/**
 * Wraps content that should only be visible to users with specific roles
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <AdminContent />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  fallback,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  // Not authenticated - show nothing (auth middleware should redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if user's role is in the allowed roles
  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    // Show custom fallback or default access denied message
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              You do not have permission to access this page.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Required role(s): {allowedRoles.join(', ')}
            </p>
            <p className="text-sm text-slate-500">
              Your role: {user.role}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has permission - render children
  return <>{children}</>;
}
