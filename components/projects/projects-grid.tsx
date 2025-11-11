'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  title: string;
  clientName: string;
  status: 'draft' | 'in_review' | 'completed' | 'sent';
  updatedAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  template: {
    name: string;
  };
}

export function ProjectsGrid({
  projects,
  loading,
  pagination,
  onPageChange,
}: {
  projects: Project[];
  loading: boolean;
  pagination: { page: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h3 className="text-lg font-semibold mb-2">No projects found</h3>
        <p className="text-slate-600 mb-6">
          Get started by creating your first demand letter
        </p>
        <Button onClick={() => router.push('/dashboard/projects/new/upload')}>
          Create New Demand Letter
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">
                {project.title}
              </h3>
              <StatusBadge status={project.status} />
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Client: {project.clientName}</span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{project.template.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {project.creator.firstName} {project.creator.lastName}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-800 border-slate-200' },
    in_review: { label: 'In Review', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
    sent: { label: 'Sent', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  };

  const config = variants[status] || variants.draft;

  return <Badge className={config.className}>{config.label}</Badge>;
}
