'use client';

/**
 * Variables List Component with Drag-and-Drop
 * Story 3.5: AC #10 - Variable definition and management with reordering
 * Manages template variables that can be used in sections
 */

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VariableItem } from './variable-item';
import { VariableModal } from './variable-modal';
import type { TemplateVariable } from '@/lib/types/template';

interface VariablesListProps {
  variables: TemplateVariable[];
  onAdd: (variable: TemplateVariable) => void;
  onEdit: (index: number, variable: TemplateVariable) => void;
  onDelete: (index: number) => void;
  onReorder?: (variables: TemplateVariable[]) => void;
}

export function VariablesList({ variables, onAdd, onEdit, onDelete, onReorder }: VariablesListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = variables.findIndex((v) => v.name === active.id);
      const newIndex = variables.findIndex((v) => v.name === over.id);

      const reordered = arrayMove(variables, oldIndex, newIndex);
      onReorder?.(reordered);
    }
  };

  const handleAddClick = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleModalSave = (variable: TemplateVariable) => {
    if (editingIndex !== null) {
      onEdit(editingIndex, variable);
    } else {
      onAdd(variable);
    }
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Template Variables</h2>
        <Button onClick={handleAddClick} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Variable
        </Button>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Variables can be used in sections using the syntax: <code className="bg-slate-100 px-1 py-0.5 rounded">{`{{variable_name}}`}</code>
      </p>

      {variables.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-slate-600 mb-4">No variables defined yet</p>
          <Button onClick={handleAddClick} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Variable
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={variables.map((v) => v.name)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {variables.map((variable, index) => (
                <VariableItem
                  key={variable.name}
                  variable={variable}
                  onEdit={() => handleEditClick(index)}
                  onDelete={() => onDelete(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <VariableModal
        isOpen={isModalOpen}
        variable={editingIndex !== null ? variables[editingIndex] : null}
        existingVariableNames={variables.map(v => v.name).filter((_, i) => i !== editingIndex)}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />
    </div>
  );
}
