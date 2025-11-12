/**
 * Admin Layout
 * Layout for admin panel with navigation
 * Story 6.13 - Admin Panel Dashboard
 */

import { redirect } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AdminNav } from '@/components/admin/admin-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-slate-50">
        <AdminNav />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
