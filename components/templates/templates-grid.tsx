'use client';

/**
 * Templates Grid Component
 * Story 3.3: AC #1, #8, #9, #10
 * Displays templates in responsive grid with loading and empty states
 */

import { useRouter } from 'next/navigation';
import { TemplateCard } from './template-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Plus } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  sections: any[];
  updatedAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface TemplatesGridProps {
  templates: Template[];
  loading: boolean;
  pagination: { page: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onUseTemplate: (templateId: string) => void;
}

export function TemplatesGrid({
  templates,
  loading,
  pagination,
  onPageChange,
  onUseTemplate,
}: TemplatesGridProps) {
  const router = useRouter();

  // AC #9: Loading skeleton displayed while templates fetch
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {[...Array(8)].map((_, i) => (
          <TemplateCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // AC #8: Empty state displayed when no templates exist
  if (templates.length === 0) {
    return (
      <Card className="border-dashed border-2 mt-6">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-slate-100 p-4 mb-4">
            <FileText className="h-12 w-12 text-slate-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            No Templates Found
          </h2>
          <p className="text-slate-600 text-center max-w-md mb-6">
            Get started by creating your first template. Templates help you standardize your demand letters and speed up document generation.
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/dashboard/templates/new')}
          >
            <Plus className="h-5 w-5 mr-2" />
            Create First Template
          </Button>
        </CardContent>
      </Card>
    );
  }

  // AC #10: Mobile-responsive grid layout (1 column mobile, 2-3 tablet, 4+ desktop)
  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onView={(id) => router.push(`/dashboard/templates/${id}`)}
            onUse={onUseTemplate}
          />
        ))}
      </div>

      {/* Pagination */}
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

/**
 * Template Card Skeleton - Loading State
 * AC #9: Loading skeleton displayed while templates fetch
 */
function TemplateCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <div className="p-6 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="h-6 bg-slate-200 rounded animate-pulse flex-1" />
          <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
        </div>
      </div>

      <div className="px-6 flex-1 space-y-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 rounded animate-pulse flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 rounded animate-pulse flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 rounded animate-pulse flex-1" />
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="h-10 bg-slate-200 rounded animate-pulse" />
      </div>
    </Card>
  );
}
