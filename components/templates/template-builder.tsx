'use client';

/**
 * Template Builder Component
 * Story 3.4: Main template builder with sections management and preview
 * AC #2, #11, #12 - Form fields, save draft, publish template
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SectionsList } from './sections-list';
import { VariablesList } from './variables-list';
import { SectionPreview } from './section-preview';
import { apiClient } from '@/lib/api/client';
import { AlertCircle, Save, CheckCircle } from 'lucide-react';
import type { TemplateSection, TemplateVariable } from '@/lib/types/template';

// Form validation schema
const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateBuilderProps {
  initialTemplate?: any;
}

export function TemplateBuilder({ initialTemplate }: TemplateBuilderProps) {
  const router = useRouter();
  const [sections, setSections] = useState<TemplateSection[]>(initialTemplate?.sections || []);
  const [variables, setVariables] = useState<TemplateVariable[]>(initialTemplate?.variables || []);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{message: string; sectionId?: string}[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: initialTemplate?.name || '',
      description: initialTemplate?.description || '',
      category: initialTemplate?.category || '',
    },
  });

  // Watch form values for preview
  const formValues = watch();

  // Handle section reordering
  const handleSectionReorder = (newSections: TemplateSection[]) => {
    setSections(newSections);
  };

  // Handle variable reordering
  const handleVariableReorder = (newVariables: TemplateVariable[]) => {
    setVariables(newVariables);
  };

  // Handle section add
  const handleSectionAdd = (section: TemplateSection) => {
    setSections([...sections, section]);
    setSuccess('Section added successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle section edit
  const handleSectionEdit = (updatedSection: TemplateSection) => {
    setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s));
    setSuccess('Section updated successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle section delete
  const handleSectionDelete = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
    setSuccess('Section deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle variable add
  const handleVariableAdd = (variable: TemplateVariable) => {
    setVariables([...variables, variable]);
    setSuccess('Variable added successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle variable edit
  const handleVariableEdit = (index: number, updatedVariable: TemplateVariable) => {
    const newVariables = [...variables];
    newVariables[index] = updatedVariable;
    setVariables(newVariables);
    setSuccess('Variable updated successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle variable delete
  const handleVariableDelete = (index: number) => {
    const variable = variables[index];

    // Check if variable is used in any sections
    const usedInSections = sections.filter(s =>
      s.content?.includes(`{{${variable.name}}}`)
    );

    if (usedInSections.length > 0) {
      setError(`Cannot delete variable "${variable.name}" - it's used in ${usedInSections.length} section(s)`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    setVariables(variables.filter((_, i) => i !== index));
    setSuccess('Variable deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Validate template before publishing
  const validateTemplate = (): {message: string; sectionId?: string}[] => {
    const errors: {message: string; sectionId?: string}[] = [];

    if (!formValues.name?.trim()) {
      errors.push({ message: 'Template name is required' });
    }

    if (sections.length === 0) {
      errors.push({ message: 'At least one section is required' });
    }

    // Check AI-generated sections have prompt guidance
    sections.forEach((section, index) => {
      if (section.type === 'ai_generated' && !section.promptGuidance?.trim()) {
        errors.push({
          message: `Section "${section.title}" (AI Generated) must have prompt guidance`,
          sectionId: section.id,
        });
      }
    });

    // Check variable references
    const definedVarNames = new Set(variables.map(v => v.name));
    const varPattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;

    sections.forEach((section) => {
      if (section.content) {
        const matches = section.content.matchAll(varPattern);
        for (const match of matches) {
          const varName = match[1];
          if (!definedVarNames.has(varName)) {
            errors.push({
              message: `Section "${section.title}" references undefined variable: {{${varName}}}`,
              sectionId: section.id,
            });
          }
        }
      }
    });

    return errors;
  };

  // Scroll to a problematic section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the section briefly
      element.classList.add('ring-2', 'ring-red-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-red-500');
      }, 2000);
    }
  };

  // Save as draft
  const handleSaveDraft = async (data: TemplateFormData) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        name: data.name,
        description: data.description || null,
        sections,
        variables,
      };

      if (initialTemplate?.id) {
        await apiClient.put(`/api/templates/${initialTemplate.id}`, payload);
        setSuccess('Draft saved successfully');
      } else {
        const response = await apiClient.post('/api/templates', payload);
        setSuccess('Draft saved successfully');
        // Navigate to edit page after creating
        setTimeout(() => {
          router.push(`/dashboard/templates/${response.data.template.id}/edit`);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error saving draft:', err);
      setError(err.response?.data?.error?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Publish template
  const handlePublish = async (data: TemplateFormData) => {
    try {
      setPublishing(true);
      setError(null);
      setSuccess(null);
      setValidationErrors([]);

      // Validate template
      const errors = validateTemplate();
      if (errors.length > 0) {
        setValidationErrors(errors);
        setPublishing(false);
        return;
      }

      const payload = {
        name: data.name,
        description: data.description || null,
        sections,
        variables,
      };

      if (initialTemplate?.id) {
        await apiClient.put(`/api/templates/${initialTemplate.id}`, payload);
        setSuccess('Template published successfully');
        setTimeout(() => {
          router.push('/dashboard/templates');
        }, 1500);
      } else {
        await apiClient.post('/api/templates', payload);
        setSuccess('Template published successfully');
        setTimeout(() => {
          router.push('/dashboard/templates');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error publishing template:', err);
      setError(err.response?.data?.error?.message || 'Failed to publish template');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form Area - 2 columns */}
      <div className="lg:col-span-2 space-y-6">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Please fix the following errors before publishing:</div>
              <ul className="space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span className="flex-1">
                      {err.message}
                      {err.sectionId && (
                        <button
                          type="button"
                          onClick={() => scrollToSection(err.sectionId!)}
                          className="ml-2 text-sm underline hover:no-underline"
                        >
                          Go to section
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Info Form */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Personal Injury Demand Letter"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this template's purpose..."
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category / Type</Label>
              <Input
                id="category"
                placeholder="e.g., Personal Injury, Contract Dispute"
                {...register('category')}
              />
            </div>
          </div>
        </div>

        {/* Tabs for Sections and Variables */}
        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sections">
              Sections ({sections.length})
            </TabsTrigger>
            <TabsTrigger value="variables">
              Variables ({variables.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="mt-4">
            <SectionsList
              sections={sections}
              variables={variables}
              onReorder={handleSectionReorder}
              onAdd={handleSectionAdd}
              onEdit={handleSectionEdit}
              onDelete={handleSectionDelete}
            />
          </TabsContent>

          <TabsContent value="variables" className="mt-4">
            <VariablesList
              variables={variables}
              onAdd={handleVariableAdd}
              onEdit={handleVariableEdit}
              onDelete={handleVariableDelete}
              onReorder={handleVariableReorder}
            />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSubmit(handleSaveDraft)}
              disabled={saving || publishing}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>

            <Button
              onClick={handleSubmit(handlePublish)}
              disabled={saving || publishing}
            >
              {publishing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Panel - 1 column */}
      <div className="lg:col-span-1">
        <SectionPreview
          templateName={formValues.name || 'Untitled Template'}
          sections={sections}
          variables={variables}
        />
      </div>
    </div>
  );
}
