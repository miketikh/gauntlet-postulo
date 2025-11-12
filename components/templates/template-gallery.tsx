/**
 * Template Gallery Component
 * Displays available templates in a grid with selection functionality
 * Part of Story 2.8 - AI Generation Workflow UI
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Layers } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  sections: any[];
  variables: any[];
}

interface TemplateGalleryProps {
  templates: Template[];
  projectId?: string;
}

export function TemplateGallery({ templates, projectId }: TemplateGalleryProps) {
  const router = useRouter();

  const handleSelectTemplate = (templateId: string) => {
    const params = new URLSearchParams({ templateId });
    if (projectId) {
      params.append('projectId', projectId);
    }
    router.push(`/dashboard/projects/new/variables?${params.toString()}`);
  };

  if (templates.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h3 className="text-lg font-semibold mb-2">No templates available</h3>
        <p className="text-slate-600 mb-4">
          Ask your administrator to create templates for your firm.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => handleSelectTemplate(template.id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <CardTitle className="group-hover:text-blue-600 transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription>
              {template.description || 'No description available'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Layers className="h-4 w-4" />
                <span>
                  {Array.isArray(template.sections) ? template.sections.length : 0} sections
                </span>
              </div>
              <Button className="w-full" onClick={(e) => {
                e.stopPropagation();
                handleSelectTemplate(template.id);
              }}>
                Use This Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
