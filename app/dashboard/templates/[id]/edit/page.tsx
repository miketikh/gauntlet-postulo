'use client';

/**
 * Template Builder - Edit Template Page
 * Story 3.4: AC #1 - Template builder page at /templates/:id/edit
 * Allows admin/attorney to edit existing templates
 * RBAC: Only admin and attorney roles can access
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TemplateBuilder } from '@/components/templates/template-builder';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const { user } = useAuth();
  const [template, setTemplate] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/templates/${templateId}`);
      setTemplate(response.data.template);
    } catch (err: unknown) {
      console.error('Error fetching template:', err);
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setError(error.response?.data?.error?.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user !== null) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'attorney') {
        setAuthorized(false);
        setLoading(false);
      } else {
        setAuthorized(true);
        void fetchTemplate();
      }
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to edit templates. Only administrators and attorneys can edit templates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Template not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Template</h1>
        <p className="text-slate-600 mt-1">
          Update sections, variables, and structure for {String(template.name)}
        </p>
      </div>

      <TemplateBuilder initialTemplate={template} />
    </div>
  );
}
