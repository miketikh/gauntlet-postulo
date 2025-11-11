'use client';

/**
 * Variable Item Component
 * Story 3.5: AC #10 - Individual variable with edit and delete buttons
 * Sortable item for drag-and-drop reordering
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import type { TemplateVariable } from '@/lib/types/template';

interface VariableItemProps {
  variable: TemplateVariable;
  onEdit: () => void;
  onDelete: () => void;
}

export function VariableItem({ variable, onEdit, onDelete }: VariableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getVariableTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'number':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'date':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'currency':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div
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

      {/* Variable Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code className="font-mono text-sm font-medium text-purple-600">
            {`{{${variable.name}}}`}
          </code>
          <Badge className={getVariableTypeBadgeColor(variable.type)}>
            {variable.type}
          </Badge>
          {variable.required && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
        </div>
        {variable.defaultValue !== null && (
          <p className="text-sm text-slate-600">
            Default: <span className="font-medium">{variable.defaultValue}</span>
          </p>
        )}
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
