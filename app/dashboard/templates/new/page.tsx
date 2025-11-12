'use client';

/**
 * Template Builder - New Template Page
 * Story 3.4: AC #1 - Template builder page at /templates/new
 * Allows admin/attorney to create new templates with sections and variables
 * RBAC: Only admin and attorney roles can access
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateBuilder } from '@/components/templates/template-builder';
import { useAuth } from '@/lib/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function NewTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (user !== null) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'attorney') {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    }
  }, [user, router]);

  if (user === null) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
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
            You do not have permission to create templates. Only administrators and attorneys can create templates.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Template</h1>
        <p className="text-slate-600 mt-1">
          Define sections, variables, and structure for your demand letter template
        </p>
      </div>

      <TemplateBuilder />
    </div>
  );
}
