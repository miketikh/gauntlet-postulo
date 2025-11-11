'use client';

/**
 * Dashboard Home Page
 * Welcome message and empty state with CTA
 * Based on architecture.md dashboard requirements
 */

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, Plus } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleNewDemandLetter = () => {
    router.push('/dashboard/projects/new/upload');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-slate-600">
          Generate professional demand letters with AI assistance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              No projects created yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Draft Letters</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              No drafts in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Templates Available</CardDescription>
            <CardTitle className="text-3xl">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ready to use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State with CTA */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-slate-100 p-4 mb-4">
            <FileText className="h-12 w-12 text-slate-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Create Your First Demand Letter
          </h2>
          <p className="text-slate-600 text-center max-w-md mb-6">
            Get started by creating a new project. Upload case documents, select
            a template, and let AI generate your demand letter.
          </p>
          <Button size="lg" onClick={handleNewDemandLetter}>
            <Plus className="h-5 w-5 mr-2" />
            New Demand Letter
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>
              Your latest projects and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Browse Templates
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
