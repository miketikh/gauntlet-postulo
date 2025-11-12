/**
 * Refinement Panel Component V2
 * Allows users to refine AI-generated content with preview mode
 * Story 5.4 - Preview & Apply UI
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  Check,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useRefineDraft } from '@/lib/hooks/useRefineDraft';

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
 */
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'make-assertive',
    label: 'Make More Assertive',
    description: 'Strengthen language and emphasize demands',
    instruction: 'Rewrite this section to be more assertive and forceful. Strengthen the language, emphasize the demands, and use more confident phrasing while maintaining professional tone.',
    icon: Zap,
    color: 'text-red-600',
  },
  {
    id: 'add-detail',
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
    id: 'emphasize-liability',
    label: 'Emphasize Liability',
    description: "Highlight defendant's responsibility",
    instruction: "Rewrite this section to emphasize the defendant's liability and responsibility. Strengthen arguments about fault and legal obligations while citing relevant facts.",
    icon: Scale,
    color: 'text-orange-600',
  },
  {
    id: 'soften-tone',
    label: 'Soften Tone',
    description: 'Make language more conciliatory',
    instruction: 'Adjust this section to use a softer, more conciliatory tone. Make the language less aggressive while still maintaining the key points and legal position.',
    icon: Heart,
    color: 'text-pink-600',
  },
  {
    id: 'improve-clarity',
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
   * Callback when refined text is applied to editor
   */
  onApply: (refinedText: string) => void;

  /**
   * Draft ID for refinement request
   */
  draftId: string;

  /**
   * Optional context for refinement
   */
  context?: {
    plaintiffName?: string;
    defendantName?: string;
    caseDescription?: string;
    documentType?: string;
  };

  /**
   * CSS class name
   */
  className?: string;
}

type PanelMode = 'input' | 'preview';

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
 * Refinement Panel V2 with Preview Mode
 *
 * Features:
 * - Display selected text with character/word count
 * - Quick Actions mode with preset refinement buttons
 * - Custom Instructions mode with free-form textarea
 * - Preview mode with side-by-side comparison
 * - Streaming display during AI generation
 * - Apply/Discard/Refine Again actions
 */
export function RefinementPanelV2({
  selectedText,
  isOpen,
  onClose,
  onApply,
  draftId,
  context,
  className,
}: RefinementPanelProps) {
  const [mode, setMode] = useState<PanelMode>('input');
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
  const [customInstruction, setCustomInstruction] = useState('');
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
  const [savedInstruction, setSavedInstruction] = useState('');
  const [savedQuickActionId, setSavedQuickActionId] = useState<string | null>(null);

  const { refine, reset, state } = useRefineDraft();

  const originalStats = getTextStats(selectedText);
  const refinedStats = getTextStats(state.refinedText);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setMode('input');
      setCustomInstruction('');
      setSelectedQuickAction(null);
      setSavedInstruction('');
      setSavedQuickActionId(null);
    }
  }, [isOpen, reset]);

  // Handle quick action button click
  const handleQuickAction = useCallback((action: QuickAction) => {
    setSelectedQuickAction(action.id);
    setCustomInstruction(action.instruction);
  }, []);

  // Handle apply refinement
  const handleRefine = useCallback(async () => {
    if (!customInstruction.trim()) {
      return;
    }

    setSavedInstruction(customInstruction);
    setSavedQuickActionId(selectedQuickAction);

    try {
      await refine({
        draftId,
        selectedText,
        instruction: customInstruction,
        quickActionId: selectedQuickAction || undefined,
        context,
      });

      // Switch to preview mode after refinement starts
      setMode('preview');
    } catch (error) {
      console.error('Refinement error:', error);
      // Error is already in state, no need to handle here
    }
  }, [customInstruction, selectedQuickAction, draftId, selectedText, context, refine]);

  // Handle apply to editor
  const handleApplyToEditor = useCallback(() => {
    onApply(state.refinedText);
    onClose();
  }, [state.refinedText, onApply, onClose]);

  // Handle discard
  const handleDiscard = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle refine again
  const handleRefineAgain = useCallback(() => {
    reset();
    setMode('input');
    setCustomInstruction(savedInstruction);
    setSelectedQuickAction(savedQuickActionId);
  }, [reset, savedInstruction, savedQuickActionId]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (mode === 'preview') {
        handleDiscard();
      } else {
        onClose();
      }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (mode === 'input') {
        handleRefine();
      } else if (mode === 'preview' && !state.isRefining) {
        handleApplyToEditor();
      }
    }
  }, [mode, state.isRefining, handleRefine, handleApplyToEditor, handleDiscard, onClose]);

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
            <CardTitle className="text-lg">
              {mode === 'input' ? 'Refine with AI' : 'Preview Refinement'}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={mode === 'preview' ? handleDiscard : onClose}
            disabled={state.isRefining}
            aria-label="Close refinement panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {mode === 'input'
            ? 'Improve the selected text with AI assistance'
            : 'Review the refined text and apply or discard changes'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {mode === 'input' && (
          <>
            {/* Selected Text Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Selected Text</label>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {originalStats.words} {originalStats.words === 1 ? 'word' : 'words'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {originalStats.characters} {originalStats.characters === 1 ? 'character' : 'characters'}
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
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'quick' | 'custom')}
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
                onClick={handleRefine}
                disabled={!customInstruction.trim()}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Refinement
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
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
          </>
        )}

        {mode === 'preview' && (
          <>
            {/* Side-by-side comparison */}
            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
              {/* Original Text */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Original</label>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {originalStats.words} words
                    </Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1 rounded-md border bg-muted/50 p-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedText}
                  </p>
                </ScrollArea>
              </div>

              {/* Refined Text */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Refined</label>
                  <div className="flex gap-2">
                    {state.isRefining && (
                      <Badge variant="outline" className="text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Generating...
                      </Badge>
                    )}
                    {!state.isRefining && state.refinedText && (
                      <Badge variant="secondary" className="text-xs">
                        {refinedStats.words} words
                      </Badge>
                    )}
                  </div>
                </div>
                <ScrollArea className="flex-1 rounded-md border bg-primary/5 p-3">
                  {state.isRefining && !state.refinedText && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                  {state.refinedText && (
                    <p className="text-sm whitespace-pre-wrap">
                      {state.refinedText}
                    </p>
                  )}
                  {state.error && (
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <p className="text-sm">{state.error}</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* Metadata Display */}
            {state.metadata && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Tokens: {state.metadata.tokenUsage.inputTokens + state.metadata.tokenUsage.outputTokens}</span>
                <span>•</span>
                <span>Duration: {(state.metadata.duration / 1000).toFixed(1)}s</span>
                <span>•</span>
                <span>Model: {state.metadata.model}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleApplyToEditor}
                disabled={state.isRefining || !state.refinedText || !!state.error}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleRefineAgain}
                disabled={state.isRefining}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refine Again
              </Button>
              <Button
                variant="outline"
                onClick={handleDiscard}
                disabled={state.isRefining}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Discard
              </Button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="text-xs text-muted-foreground text-center">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">Esc</kbd> to discard •{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> to apply
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
