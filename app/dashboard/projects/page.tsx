'use client';

/**
 * Projects Dashboard Page
 * Displays all demand letter projects with filtering and search
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProjectsGrid } from '@/components/projects/projects-grid';
import { ProjectsFilters } from '@/components/projects/projects-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get filter params
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchProjects();
  }, [status, search, page]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      params.set('page', page.toString());

      const response = await apiClient.get(`/api/projects?${params}`);

      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.error?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: { status?: string; search?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (filters.status !== undefined) {
      if (filters.status) {
        params.set('status', filters.status);
      } else {
        params.delete('status');
      }
    }

    if (filters.search !== undefined) {
      if (filters.search) {
        params.set('search', filters.search);
      } else {
        params.delete('search');
      }
    }

    params.set('page', '1'); // Reset to page 1
    router.push(`/dashboard/projects?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/dashboard/projects?${params.toString()}`);
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-slate-600 mt-1">
            Manage your demand letters
          </p>
        </div>

        <Button onClick={() => router.push('/dashboard/projects/new/upload')}>
          <Plus className="h-4 w-4 mr-2" />
          New Demand Letter
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <ProjectsFilters
        currentStatus={status}
        currentSearch={search}
        onChange={handleFilterChange}
      />

      <ProjectsGrid
        projects={projects}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
