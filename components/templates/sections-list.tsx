'use client';

/**
 * Sections List Component with Drag-and-Drop
 * Story 3.4: AC #3, #4, #9 - Section list with reordering, add button, edit/delete
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
import { SectionItem } from './section-item';
import { SectionModal } from './section-modal';
import type { TemplateSection, TemplateVariable } from '@/lib/types/template';

interface SectionsListProps {
  sections: TemplateSection[];
  variables: TemplateVariable[];
  onReorder: (sections: TemplateSection[]) => void;
  onAdd: (section: TemplateSection) => void;
  onEdit: (section: TemplateSection) => void;
  onDelete: (sectionId: string) => void;
}

export function SectionsList({
  sections,
  variables,
  onReorder,
  onAdd,
  onEdit,
  onDelete,
}: SectionsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TemplateSection | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(sections, oldIndex, newIndex);

      // Update order values
      const withUpdatedOrder = reordered.map((section, index) => ({
        ...section,
        order: index + 1,
      }));

      onReorder(withUpdatedOrder);
    }
  };

  const handleAddClick = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (section: TemplateSection) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleModalSave = (section: TemplateSection) => {
    if (editingSection) {
      onEdit(section);
    } else {
      onAdd(section);
    }
    setIsModalOpen(false);
    setEditingSection(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSection(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Document Sections</h2>
        <Button onClick={handleAddClick} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-slate-600 mb-4">No sections yet</p>
          <Button onClick={handleAddClick} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Section
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  onEdit={() => handleEditClick(section)}
                  onDelete={() => onDelete(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <SectionModal
        isOpen={isModalOpen}
        section={editingSection}
        variables={variables}
        onSave={handleModalSave}
        onClose={handleModalClose}
        nextOrder={sections.length + 1}
      />
    </div>
  );
}
