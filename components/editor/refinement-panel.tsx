/**
 * Refinement Panel Component
 * Allows users to refine AI-generated content with quick actions or custom instructions
 * Part of Story 5.1 - Design AI Refinement UI with Section Selection
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  X,
  Zap,
  PlusCircle,
  Scissors,
  Scale,
  Heart,
  Eye,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';

/**
 * Quick action button configuration
 */
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  instruction: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

/**
 * Quick actions for common refinements
 * These map to Story 5.2 requirements
 */
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'assertive',
    label: 'Make More Assertive',
    description: 'Strengthen language and emphasize demands',
    instruction: 'Rewrite this section to be more assertive and forceful. Strengthen the language, emphasize the demands, and use more confident phrasing while maintaining professional tone.',
    icon: Zap,
    color: 'text-red-600',
  },
  {
    id: 'detail',
    label: 'Add More Detail',
    description: 'Expand content with additional context',
    instruction: 'Expand this section with more detail and context. Add relevant facts, background information, and supporting details while maintaining clarity and coherence.',
    icon: PlusCircle,
    color: 'text-blue-600',
  },
  {
    id: 'shorten',
    label: 'Shorten This Section',
    description: 'Condense content while preserving key points',
    instruction: 'Make this section more concise. Remove redundancy and unnecessary words while preserving all key points and essential information.',
    icon: Scissors,
    color: 'text-purple-600',
  },
  {
    id: 'liability',
    label: 'Emphasize Liability',
    description: "Highlight defendant's responsibility",
    instruction: "Rewrite this section to emphasize the defendant's liability and responsibility. Strengthen arguments about fault and legal obligations while citing relevant facts.",
    icon: Scale,
    color: 'text-orange-600',
  },
  {
    id: 'soften',
    label: 'Soften Tone',
    description: 'Make language more conciliatory',
    instruction: 'Adjust this section to use a softer, more conciliatory tone. Make the language less aggressive while still maintaining the key points and legal position.',
    icon: Heart,
    color: 'text-pink-600',
  },
  {
    id: 'clarity',
    label: 'Improve Clarity',
    description: 'Simplify complex language',
    instruction: 'Improve the clarity of this section. Simplify complex sentences, use clearer language, and make the content more accessible while maintaining legal accuracy.',
    icon: Eye,
    color: 'text-green-600',
  },
];

export interface RefinementPanelProps {
  /**
   * Selected text to refine
   */
  selectedText: string;

  /**
   * Whether the panel is open
   */
  isOpen: boolean;

  /**
   * Callback when panel is closed
   */
  onClose: () => void;

  /**
   * Callback when refinement is triggered
   */
  onRefine: (instruction: string, quickActionId?: string) => void;

  /**
   * Whether refinement is in progress
   */
  isRefining?: boolean;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Calculate word and character count for selected text
 */
function getTextStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = trimmed.length;
  return { words, characters };
}

/**
 * Refinement Panel
 *
 * Features:
 * - Display selected text with character/word count
 * - Quick Actions mode with preset refinement buttons
 * - Custom Instructions mode with free-form textarea
 * - Apply/Cancel actions
 * - Keyboard navigation and accessibility
 */
export function RefinementPanel({
  selectedText,
  isOpen,
  onClose,
  onRefine,
  isRefining = false,
  className,
}: RefinementPanelProps) {
  const [activeMode, setActiveMode] = useState<'quick' | 'custom'>('quick');
  const [customInstruction, setCustomInstruction] = useState('');
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);

  const stats = getTextStats(selectedText);

  // Handle quick action button click
  const handleQuickAction = useCallback((action: QuickAction) => {
    setSelectedQuickAction(action.id);
    setCustomInstruction(action.instruction);
  }, []);

  // Handle apply refinement
  const handleApply = useCallback(() => {
    if (!customInstruction.trim()) {
      return;
    }
    onRefine(customInstruction, selectedQuickAction || undefined);
  }, [customInstruction, selectedQuickAction, onRefine]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setCustomInstruction('');
    setSelectedQuickAction(null);
    onClose();
  }, [onClose]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleApply();
    }
  }, [handleApply, handleCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <Card
      className={cn('h-full flex flex-col', className)}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Refine with AI</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={isRefining}
            aria-label="Close refinement panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Improve the selected text with AI assistance
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Selected Text Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Selected Text</label>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {stats.words} {stats.words === 1 ? 'word' : 'words'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {stats.characters} {stats.characters === 1 ? 'character' : 'characters'}
              </Badge>
            </div>
          </div>
          <ScrollArea className="h-32 rounded-md border bg-muted/50 p-3">
            <p className="text-sm whitespace-pre-wrap">
              {selectedText || 'No text selected'}
            </p>
          </ScrollArea>
        </div>

        {/* Refinement Modes */}
        <Tabs
          value={activeMode}
          onValueChange={(value) => setActiveMode(value as 'quick' | 'custom')}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Actions</TabsTrigger>
            <TabsTrigger value="custom">Custom Instructions</TabsTrigger>
          </TabsList>

          {/* Quick Actions Tab */}
          <TabsContent value="quick" className="flex-1 space-y-3 mt-4">
            <ScrollArea className="h-full">
              <div className="grid gap-2 pr-4">
                <TooltipProvider>
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    const isSelected = selectedQuickAction === action.id;

                    return (
                      <Tooltip key={action.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isSelected ? 'default' : 'outline'}
                            className={cn(
                              'justify-start h-auto py-3 px-4',
                              isSelected && 'ring-2 ring-primary'
                            )}
                            onClick={() => handleQuickAction(action)}
                            disabled={isRefining}
                          >
                            <Icon className={cn('h-4 w-4 mr-2 flex-shrink-0', action.color)} />
                            <span className="text-left">{action.label}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p>{action.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Custom Instructions Tab */}
          <TabsContent value="custom" className="flex-1 flex flex-col mt-4">
            <div className="flex-1 flex flex-col gap-2">
              <label htmlFor="custom-instruction" className="text-sm font-medium">
                Refinement Instructions
              </label>
              <Textarea
                id="custom-instruction"
                placeholder="Describe how to improve this section..."
                value={customInstruction}
                onChange={(e) => {
                  setCustomInstruction(e.target.value);
                  setSelectedQuickAction(null);
                }}
                disabled={isRefining}
                className="flex-1 resize-none min-h-[200px]"
                aria-label="Custom refinement instructions"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what changes you want to make to the selected text.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleApply}
            disabled={!customInstruction.trim() || isRefining}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isRefining ? 'Refining...' : 'Apply Refinement'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isRefining}
          >
            Cancel
          </Button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="text-xs text-muted-foreground text-center">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">Esc</kbd> to cancel •{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> to apply
        </div>
      </CardContent>
    </Card>
  );
}
