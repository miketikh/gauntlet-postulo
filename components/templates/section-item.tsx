'use client';

/**
 * Section Item Component
 * Story 3.4: AC #9 - Individual section with edit and delete buttons
 * Sortable item for drag-and-drop
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Edit2, Trash2, FileText, Sparkles, Variable } from 'lucide-react';
import type { TemplateSection } from '@/lib/types/template';

interface SectionItemProps {
  section: TemplateSection;
  onEdit: () => void;
  onDelete: () => void;
}

export function SectionItem({ section, onEdit, onDelete }: SectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSectionIcon = () => {
    switch (section.type) {
      case 'static':
        return <FileText className="h-4 w-4" />;
      case 'ai_generated':
        return <Sparkles className="h-4 w-4" />;
      case 'variable':
        return <Variable className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSectionTypeLabel = () => {
    switch (section.type) {
      case 'static':
        return 'Static';
      case 'ai_generated':
        return 'AI Generated';
      case 'variable':
        return 'Variable';
      default:
        return section.type;
    }
  };

  const getSectionTypeBadgeColor = () => {
    switch (section.type) {
      case 'static':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ai_generated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'variable':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div
      id={`section-${section.id}`}
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-slate-50 border rounded-lg hover:bg-slate-100 transition-colors"
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Section Icon */}
      <div className="text-slate-600">
        {getSectionIcon()}
      </div>

      {/* Section Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium truncate">{section.title}</h3>
          <Badge className={getSectionTypeBadgeColor()}>
            {getSectionTypeLabel()}
          </Badge>
          {section.required && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
        </div>

        {/* Section Preview */}
        <p className="text-sm text-slate-600 truncate">
          {section.type === 'ai_generated' && section.promptGuidance ? (
            `Prompt: ${section.promptGuidance.substring(0, 80)}${section.promptGuidance.length > 80 ? '...' : ''}`
          ) : section.content ? (
            section.content.substring(0, 80) + (section.content.length > 80 ? '...' : '')
          ) : (
            'No content'
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
