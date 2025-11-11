'use client';

/**
 * Section Modal Component
 * Story 3.4: AC #5, #6, #7, #8 - Section configuration with type-specific fields
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TemplateSection, TemplateVariable, SectionType } from '@/lib/types/template';

const sectionFormSchema = z.object({
  title: z.string().min(1, 'Section title is required').max(255),
  type: z.enum(['static', 'ai_generated', 'variable']),
  content: z.string().nullable(),
  promptGuidance: z.string().nullable(),
  required: z.boolean(),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

interface SectionModalProps {
  isOpen: boolean;
  section: TemplateSection | null;
  variables: TemplateVariable[];
  onSave: (section: TemplateSection) => void;
  onClose: () => void;
  nextOrder: number;
}

export function SectionModal({
  isOpen,
  section,
  variables,
  onSave,
  onClose,
  nextOrder,
}: SectionModalProps) {
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      title: '',
      type: 'static',
      content: '',
      promptGuidance: '',
      required: false,
    },
  });

  const sectionType = watch('type');

  // Reset form when modal opens/closes or section changes
  useEffect(() => {
    if (isOpen) {
      if (section) {
        // Edit mode - populate with existing section data
        reset({
          title: section.title,
          type: section.type,
          content: section.content || '',
          promptGuidance: section.promptGuidance || '',
          required: section.required,
        });

        // Extract variable names from content if it's a variable section
        if (section.type === 'variable' && section.content) {
          const varPattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;
          const matches = Array.from(section.content.matchAll(varPattern));
          const vars = matches.map(m => m[1]);
          setSelectedVariables(vars);
        }
      } else {
        // Create mode - reset to defaults
        reset({
          title: '',
          type: 'static',
          content: '',
          promptGuidance: '',
          required: false,
        });
        setSelectedVariables([]);
      }
    }
  }, [isOpen, section, reset]);

  const handleVariableToggle = (varName: string) => {
    setSelectedVariables(prev => {
      if (prev.includes(varName)) {
        return prev.filter(v => v !== varName);
      } else {
        return [...prev, varName];
      }
    });
  };

  const onSubmit = (data: SectionFormData) => {
    let finalContent = data.content;
    let finalPromptGuidance = data.promptGuidance;

    // For variable sections, build content from selected variables
    if (data.type === 'variable') {
      finalContent = selectedVariables.map(v => `{{${v}}}`).join(' ');
    }

    // Clean up fields based on section type
    if (data.type !== 'ai_generated') {
      finalPromptGuidance = null;
    }

    if (data.type === 'ai_generated') {
      finalContent = null;
    }

    const updatedSection: TemplateSection = {
      id: section?.id || uuidv4(),
      title: data.title,
      type: data.type,
      content: finalContent || null,
      promptGuidance: finalPromptGuidance || null,
      required: data.required,
      order: section?.order || nextOrder,
    };

    onSave(updatedSection);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {section ? 'Edit Section' : 'Add Section'}
          </DialogTitle>
          <DialogDescription>
            Configure the section title, type, and content
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Section Title */}
          <div>
            <Label htmlFor="title">Section Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Facts and Circumstances"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Section Type */}
          <div>
            <Label htmlFor="type">Section Type *</Label>
            <Select
              value={sectionType}
              onValueChange={(value) => setValue('type', value as SectionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">Static - Boilerplate text</SelectItem>
                <SelectItem value="ai_generated">AI Generated - Dynamic content</SelectItem>
                <SelectItem value="variable">Variable - User-provided values</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-600 mt-1">
              {sectionType === 'static' && 'Fixed content that appears in every document'}
              {sectionType === 'ai_generated' && 'Content generated by AI based on case details'}
              {sectionType === 'variable' && 'Placeholder fields filled by user'}
            </p>
          </div>

          {/* Type-Specific Fields */}
          {sectionType === 'static' && (
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter boilerplate text for this section..."
                rows={6}
                {...register('content')}
              />
              <p className="text-sm text-slate-600 mt-1">
                Use {`{{variable_name}}`} to insert variables
              </p>
              {errors.content && (
                <p className="text-red-600 text-sm mt-1">{errors.content.message}</p>
              )}
            </div>
          )}

          {sectionType === 'ai_generated' && (
            <div>
              <Label htmlFor="promptGuidance">Prompt Guidance *</Label>
              <Textarea
                id="promptGuidance"
                placeholder="Instructions for AI to generate this section...&#10;&#10;Example: Generate a detailed description of the plaintiff's injuries based on the medical records. Include severity, treatment received, and prognosis."
                rows={6}
                {...register('promptGuidance')}
              />
              <p className="text-sm text-slate-600 mt-1">
                Provide clear instructions for the AI to generate appropriate content
              </p>
              {errors.promptGuidance && (
                <p className="text-red-600 text-sm mt-1">{errors.promptGuidance.message}</p>
              )}
            </div>
          )}

          {sectionType === 'variable' && (
            <div>
              <Label>Select Variables *</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                {variables.length === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-4">
                    No variables defined yet. Add variables in the Variables tab first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {variables.map((variable) => (
                      <div key={variable.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`var-${variable.name}`}
                          checked={selectedVariables.includes(variable.name)}
                          onCheckedChange={() => handleVariableToggle(variable.name)}
                        />
                        <Label
                          htmlFor={`var-${variable.name}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          <span className="font-mono text-purple-600">
                            {`{{${variable.name}}}`}
                          </span>
                          <span className="text-slate-600 ml-2">
                            ({variable.type})
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Selected: {selectedVariables.length > 0 ? selectedVariables.map(v => `{{${v}}}`).join(', ') : 'None'}
              </p>
            </div>
          )}

          {/* Required Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={watch('required')}
              onCheckedChange={(checked) => setValue('required', !!checked)}
            />
            <Label htmlFor="required" className="font-normal cursor-pointer">
              This section is required
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {section ? 'Save Changes' : 'Add Section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
