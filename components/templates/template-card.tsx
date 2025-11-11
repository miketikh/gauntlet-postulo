'use client';

/**
 * Template Card Component
 * Story 3.3: AC #2, #3, #6, #7
 * Displays template information with preview and use functionality
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TemplateSection {
  id: string;
  title: string;
  type: 'static' | 'ai_generated' | 'variable';
  order: number;
}

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string | null;
    sections: TemplateSection[];
    updatedAt: string;
    creator: {
      firstName: string;
      lastName: string;
    };
  };
  onView?: (templateId: string) => void;
  onUse: (templateId: string) => void;
}

export function TemplateCard({ template, onView, onUse }: TemplateCardProps) {
  const sectionCount = template.sections?.length || 0;

  // Determine template type badge based on sections
  const getTemplateTypeBadge = () => {
    const aiSections = template.sections?.filter(s => s.type === 'ai_generated').length || 0;
    if (aiSections > 0) {
      return { label: 'AI-Powered', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    return { label: 'Standard', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  };

  const typeBadge = getTemplateTypeBadge();

  const handleCardClick = () => {
    if (onView) {
      onView(template.id);
    }
  };

  const handleUseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    onUse(template.id);
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {template.name}
          </h3>
          <Badge className={typeBadge.color}>
            {typeBadge.label}
          </Badge>
        </div>

        {template.description && (
          <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]">
            {template.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-2 pb-3">
        {/* Thumbnail Preview - Section count */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Last Modified */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>
            Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
          </span>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            By {template.creator.firstName} {template.creator.lastName}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          onClick={handleUseClick}
          className="w-full"
          variant="default"
        >
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}
