'use client';

/**
 * Section Preview Component
 * Story 3.4: AC #10 - Section preview pane with live rendering
 * Shows what the final document will look like with sample data
 */

import { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TemplateSection, TemplateVariable } from '@/lib/types/template';

interface SectionPreviewProps {
  templateName: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
}

export function SectionPreview({ templateName, sections, variables }: SectionPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);

  // Sample data for variables
  const getSampleValue = (variable: TemplateVariable): string => {
    if (variable.defaultValue !== null) {
      if (variable.type === 'currency') {
        return `$${Number(variable.defaultValue).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
      return String(variable.defaultValue);
    }

    // Generate sample data based on variable type
    switch (variable.type) {
      case 'text':
        if (variable.name.includes('name')) return 'John Doe';
        if (variable.name.includes('address')) return '123 Main Street';
        if (variable.name.includes('email')) return 'john.doe@example.com';
        if (variable.name.includes('phone')) return '(555) 123-4567';
        return 'Sample Text';
      case 'number':
        return '100';
      case 'date':
        return new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'currency':
        return '$50,000.00';
      default:
        return '[Sample Value]';
    }
  };

  // Replace variables in content with sample values
  const replaceVariables = (content: string): string => {
    let result = content;
    const varPattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;

    const matches = Array.from(content.matchAll(varPattern));
    matches.forEach((match) => {
      const varName = match[1];
      const variable = variables.find(v => v.name === varName);

      if (variable) {
        const sampleValue = getSampleValue(variable);
        result = result.replace(match[0], `<span class="font-medium text-purple-600">${sampleValue}</span>`);
      } else {
        result = result.replace(match[0], `<span class="text-red-600">[Undefined: ${varName}]</span>`);
      }
    });

    return result;
  };

  const renderSection = (section: TemplateSection) => {
    switch (section.type) {
      case 'static':
        return (
          <div className="whitespace-pre-wrap">
            {section.content ? (
              <div dangerouslySetInnerHTML={{
                __html: replaceVariables(section.content)
              }} />
            ) : (
              <p className="text-slate-400 italic">[No content]</p>
            )}
          </div>
        );

      case 'ai_generated':
        return (
          <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">AI will generate content based on:</span>
            </p>
            <p className="text-sm text-purple-700 mt-1 italic">
              "{section.promptGuidance || '[No guidance provided]'}"
            </p>
          </div>
        );

      case 'variable':
        return (
          <div className="space-y-2">
            {section.content ? (
              <div dangerouslySetInnerHTML={{
                __html: replaceVariables(section.content)
              }} />
            ) : (
              <p className="text-slate-400 italic">[No variables selected]</p>
            )}
          </div>
        );

      default:
        return <p className="text-slate-400 italic">[Unknown section type]</p>;
    }
  };

  return (
    <div className="sticky top-6 bg-white border rounded-lg overflow-hidden">
      {/* Preview Header */}
      <div className="bg-slate-50 border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-600" />
            <h3 className="font-semibold">Preview</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide' : 'Show'}
          </Button>
        </div>
        <p className="text-sm text-slate-600">
          Live preview with sample data
        </p>
      </div>

      {showPreview && (
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Template Name */}
          <div className="mb-6 pb-4 border-b">
            <h1 className="text-2xl font-bold text-slate-900">
              {templateName || 'Untitled Template'}
            </h1>
          </div>

          {/* Sections Preview */}
          {sections.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No sections to preview</p>
              <p className="text-sm text-slate-400 mt-1">
                Add sections to see the preview
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div key={section.id} className="space-y-2">
                    {/* Section Title */}
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      {section.title}
                      {section.required && (
                        <span className="text-xs text-red-600">*</span>
                      )}
                    </h2>

                    {/* Section Content */}
                    <div className="text-slate-700 leading-relaxed">
                      {renderSection(section)}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Variables Reference */}
          {variables.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Variables Used:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {variables.map((variable) => (
                  <div
                    key={variable.name}
                    className="text-xs bg-slate-50 px-2 py-1 rounded border"
                  >
                    <code className="text-purple-600 font-mono">
                      {`{{${variable.name}}}`}
                    </code>
                    <span className="text-slate-600 ml-1">
                      = {getSampleValue(variable)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
