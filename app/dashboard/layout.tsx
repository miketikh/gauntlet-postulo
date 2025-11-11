'use client';

/**
 * Dashboard Layout
 * Protected layout with top navigation, sidebar, and main content area
 * Based on architecture.md component structure
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scale, LayoutDashboard, FolderOpen, FileText, Settings, LogOut, User, UserCog } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    // Clear cookie
    document.cookie = 'accessToken=; path=/; max-age=0';
    router.push('/login');
  };

  // Redirect if not authenticated (also handled by middleware)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-slate-900" />
            <h1 className="text-xl font-bold text-slate-900">Steno</h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-slate-600" />
              <span className="text-slate-700 font-medium">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-slate-500">
                ({user.role})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <LayoutDashboard className="h-4 w-4 mr-3" />
                Dashboard
              </Button>
            </Link>

            <Link href="/dashboard/projects">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <FolderOpen className="h-4 w-4 mr-3" />
                Projects
              </Button>
            </Link>

            <Link href="/dashboard/templates">
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                <FileText className="h-4 w-4 mr-3" />
                Templates
              </Button>
            </Link>

            <div className="pt-4 border-t border-slate-200 mt-4">
              {/* Admin-only User Management link */}
              {user?.role === 'admin' && (
                <Link href="/dashboard/admin/users">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <UserCog className="h-4 w-4 mr-3" />
                    User Management
                  </Button>
                </Link>
              )}

              <Link href="/dashboard/settings">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Button>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
