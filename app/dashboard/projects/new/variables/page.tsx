/**
 * Variables Form Page
 * Collects case details and variables for demand letter generation
 * Part of Story 2.8 - AI Generation Workflow UI
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { VariablesForm } from '@/components/generation/variables-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth.store';

interface FieldError {
  field: string;
  message: string;
}

export default function VariablesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('templateId');
  const projectId = searchParams.get('projectId');
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  useEffect(() => {
    if (!templateId) {
      setTemplateError('No template selected');
      setLoading(false);
      return;
    }

    if (!projectId) {
      setTemplateError('No project found. Please start from the upload page.');
      setLoading(false);
      return;
    }

    // Fetch template details
    const accessToken = useAuthStore.getState().accessToken;
    fetch(`/api/templates/${templateId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load template');
        return res.json();
      })
      .then(data => {
        setTemplate(data.template);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading template:', err);
        setTemplateError('Failed to load template. Please try again.');
        setLoading(false);
      });
  }, [templateId, projectId]);

  const handleGenerate = async (variables: Record<string, any>) => {
    // Clear previous errors
    setSubmissionError(null);
    setFieldErrors([]);

    try {
      // Update project with template and variables
      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          templateId,
          variables,
          title: `${variables.plaintiffName || 'Untitled'} Demand Letter`,
          clientName: variables.plaintiffName || 'Unknown',
          status: 'in_review', // Move from draft to in_review
        }),
      });

      if (!response.ok) {
        // Parse error response
        const errorData = await response.json();

        if (errorData.error?.code === 'VALIDATION_ERROR' && errorData.error?.details) {
          // Map validation errors to form fields
          const mappedErrors: FieldError[] = errorData.error.details.map((detail: any) => ({
            field: detail.path?.[0] || 'unknown',
            message: detail.message || 'Invalid value',
          }));

          setFieldErrors(mappedErrors);
          setSubmissionError(errorData.error.message || 'Validation failed. Please check the form fields.');
        } else {
          // Generic error
          setSubmissionError(
            errorData.error?.message ||
            'Failed to update project. Please try again.'
          );
        }
        return;
      }

      const { project } = await response.json();

      // Navigate to streaming generation view
      router.push(`/dashboard/projects/${project.id}/generate`);
    } catch (err) {
      console.error('Error updating project:', err);
      setSubmissionError('An unexpected error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-3xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (templateError || !template) {
    return (
      <div className="container mx-auto p-8 max-w-3xl">
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{templateError || 'Template not found'}</p>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/projects/new/template')}
          >
            Return to Template Selection
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/projects/new/template')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Case Details</h1>
        <p className="text-slate-600">
          Fill in the case information to generate your demand letter using the{' '}
          <span className="font-medium">{template.name}</span> template.
        </p>
      </div>

      {/* Variables Form */}
      <VariablesForm
        template={template}
        onSubmit={handleGenerate}
        error={submissionError}
        fieldErrors={fieldErrors}
      />
    </div>
  );
}
