'use client';

/**
 * Templates Gallery Page
 * Story 3.3: Build Template Gallery View
 * Displays all available templates with search and filtering
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TemplatesGrid } from '@/components/templates/templates-grid';
import { TemplateSearch } from '@/components/templates/template-search';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/use-auth';

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get filter params
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchTemplates();
  }, [search, page]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', page.toString());
      params.set('isActive', 'true'); // Only show active templates

      const response = await apiClient.get(`/api/templates?${params}`);

      setTemplates(response.data.templates);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.response?.data?.error?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (searchQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }

    params.set('page', '1'); // Reset to page 1
    router.push(`/dashboard/templates?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/dashboard/templates?${params.toString()}`);
  };

  const handleNewTemplate = () => {
    router.push('/dashboard/templates/new');
  };

  const handleUseTemplate = (templateId: string) => {
    // Navigate to new project flow with pre-selected template
    router.push(`/dashboard/projects/new/template?templateId=${templateId}`);
  };

  // Check if user can create templates (admin or attorney only)
  const canCreateTemplate = user?.role === 'admin' || user?.role === 'attorney';

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-slate-600 mt-1">
            Browse and manage demand letter templates
          </p>
        </div>

        {canCreateTemplate && (
          <Button onClick={handleNewTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <TemplateSearch
        currentSearch={search}
        onChange={handleSearchChange}
      />

      <TemplatesGrid
        templates={templates}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
