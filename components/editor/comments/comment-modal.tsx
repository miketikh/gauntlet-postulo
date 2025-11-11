/**
 * Comment Modal Component
 * Modal for creating and viewing comment threads
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string) => Promise<void>;
  selectedText?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  placeholder?: string;
}

/**
 * Modal for adding a new comment
 *
 * Features:
 * - Text snippet preview
 * - Multi-line comment input
 * - Submit/cancel actions
 * - Loading state during submission
 */
export function CommentModal({
  open,
  onOpenChange,
  onSubmit,
  selectedText,
  title = 'Add Comment',
  description = 'Add your comment on the selected text.',
  submitLabel = 'Add Comment',
  placeholder = 'Enter your comment...',
}: CommentModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedText && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Selected text:
              </p>
              <p className="text-sm italic line-clamp-3">"{selectedText}"</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="comment-content" className="text-sm font-medium">
              Comment
            </label>
            <Textarea
              id="comment-content"
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
