/**
 * Comment Plugin
 * Handles comment highlighting, text selection, and comment decorations in Lexical
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  KEY_ESCAPE_COMMAND,
  TextNode,
  LexicalEditor,
} from 'lexical';
import { $getNodeByKey } from 'lexical';
import { CommentThread } from '@/lib/types/comment';
import { MessageSquare, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CommentPluginProps {
  /**
   * List of comment threads to highlight
   */
  threads: CommentThread[];

  /**
   * Callback when user wants to create a new comment
   */
  onCreateComment?: (selection: { start: number; end: number; text: string }) => void;

  /**
   * Callback when user clicks on a highlighted comment
   */
  onThreadClick?: (threadId: string) => void;

  /**
   * Whether the plugin is enabled
   */
  enabled?: boolean;

  /**
   * Whether to show the add comment button on text selection
   */
  showAddButton?: boolean;
}

/**
 * Calculate text offset in the document
 */
function getTextOffset(editor: LexicalEditor, node: TextNode, offset: number): number {
  let totalOffset = 0;

  editor.getEditorState().read(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const allText = root.textContent || '';
    const nodeText = node.getTextContent();
    const nodeIndex = allText.indexOf(nodeText);

    if (nodeIndex !== -1) {
      totalOffset = nodeIndex + offset;
    }
  });

  return totalOffset;
}

/**
 * Convert document offset to node and offset
 */
function offsetToNodePosition(
  editor: LexicalEditor,
  targetOffset: number
): { node: TextNode; offset: number } | null {
  let result: { node: TextNode; offset: number } | null = null;

  editor.getEditorState().read(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const allText = root.textContent || '';
    let currentOffset = 0;

    // Walk through all text nodes
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null
    );

    let textNode = walker.nextNode();
    while (textNode) {
      const textContent = textNode.textContent || '';
      const nodeLength = textContent.length;

      if (currentOffset + nodeLength >= targetOffset) {
        // Found the target node
        const localOffset = targetOffset - currentOffset;
        // TODO: Map DOM node back to Lexical node
        // This is a simplified version
        result = null; // Placeholder
        return;
      }

      currentOffset += nodeLength;
      textNode = walker.nextNode();
    }
  });

  return result;
}

/**
 * Comment Plugin Component
 *
 * This plugin:
 * 1. Displays highlights for commented text
 * 2. Shows "Add Comment" button when text is selected
 * 3. Handles clicks on highlighted comments
 * 4. Manages comment decorations in the editor
 */
export function CommentPlugin({
  threads,
  onCreateComment,
  onThreadClick,
  enabled = true,
  showAddButton = true,
}: CommentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [selectedText, setSelectedText] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);
  const [buttonPosition, setButtonPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  /**
   * Handle text selection changes
   */
  const handleSelectionChange = useCallback(() => {
    if (!enabled || !showAddButton) return;

    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        setSelectedText(null);
        setButtonPosition(null);
        return;
      }

      const text = selection.getTextContent();
      if (!text || text.trim().length === 0) {
        setSelectedText(null);
        setButtonPosition(null);
        return;
      }

      // Get selection offsets
      // Note: This is a simplified version. In production, we'd need to
      // properly calculate offsets from the root element
      const root = editor.getRootElement();
      if (!root) return;

      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) return;

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate offsets (simplified - would need more robust implementation)
      const allText = root.textContent || '';
      const selectedText = range.toString();
      const start = allText.indexOf(selectedText);
      const end = start + selectedText.length;

      if (start !== -1) {
        setSelectedText({
          text: selectedText,
          start,
          end,
        });

        // Position the button near the selection
        setButtonPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      }
    });
  }, [editor, enabled, showAddButton]);

  /**
   * Handle escape key to clear selection
   */
  const handleEscape = useCallback(() => {
    setSelectedText(null);
    setButtonPosition(null);
    return false;
  }, []);

  /**
   * Register selection change listener
   */
  useEffect(() => {
    if (!enabled) return;

    const unregisterSelectionChange = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        handleSelectionChange();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      handleEscape,
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterSelectionChange();
      unregisterEscape();
    };
  }, [editor, enabled, handleSelectionChange, handleEscape]);

  /**
   * Apply comment highlights to the editor
   */
  useEffect(() => {
    if (!enabled) return;

    // Apply CSS classes to highlight commented text
    const root = editor.getRootElement();
    if (!root) return;

    // Clear existing highlights
    const existingHighlights = root.querySelectorAll('[data-comment-thread]');
    existingHighlights.forEach((el) => {
      el.removeAttribute('data-comment-thread');
      el.classList.remove('comment-highlight', 'comment-highlight-resolved');
    });

    // Apply new highlights
    // Note: This is a simplified version using DOM manipulation
    // In production, we should use Lexical decorators or custom nodes
    const text = root.textContent || '';

    threads.forEach((thread) => {
      if (thread.selection.start >= text.length) return;

      const threadText = text.substring(
        thread.selection.start,
        Math.min(thread.selection.end, text.length)
      );

      // This is a placeholder - real implementation would use Lexical's
      // decorator system to properly highlight text
      // For now, we'll add CSS classes via DOM manipulation

      // TODO: Implement proper Lexical decorators for comment highlights
    });
  }, [editor, threads, enabled]);

  /**
   * Handle click on editor to detect comment thread clicks
   */
  useEffect(() => {
    if (!enabled) return;

    const root = editor.getRootElement();
    if (!root) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const threadElement = target.closest('[data-comment-thread]');

      if (threadElement) {
        const threadId = threadElement.getAttribute('data-comment-thread');
        if (threadId && onThreadClick) {
          onThreadClick(threadId);
        }
      }
    };

    root.addEventListener('click', handleClick);

    return () => {
      root.removeEventListener('click', handleClick);
    };
  }, [editor, enabled, onThreadClick]);

  /**
   * Handle create comment button click
   */
  const handleCreateComment = useCallback(() => {
    if (selectedText && onCreateComment) {
      onCreateComment(selectedText);
      setSelectedText(null);
      setButtonPosition(null);
    }
  }, [selectedText, onCreateComment]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Add Comment Button */}
      {selectedText && buttonPosition && showAddButton && (
        <div
          style={{
            position: 'absolute',
            top: `${buttonPosition.top}px`,
            left: `${buttonPosition.left}px`,
            zIndex: 1000,
          }}
        >
          <Button
            size="sm"
            variant="default"
            onClick={handleCreateComment}
            className="shadow-lg"
          >
            <MessageSquarePlus className="h-4 w-4 mr-1" />
            Add Comment
          </Button>
        </div>
      )}
    </>
  );
}

/**
 * Helper hook to manage comment highlights
 * Returns functions to add, remove, and update comment highlights
 */
export function useCommentHighlights(editor: LexicalEditor) {
  const addHighlight = useCallback(
    (threadId: string, start: number, end: number, resolved: boolean) => {
      // TODO: Implement using Lexical decorators
      // This would create a decorator node that wraps the commented text
      // with appropriate styling and data attributes
    },
    [editor]
  );

  const removeHighlight = useCallback(
    (threadId: string) => {
      // TODO: Implement
      // Remove the decorator for the given thread
    },
    [editor]
  );

  const updateHighlight = useCallback(
    (threadId: string, start: number, end: number) => {
      // TODO: Implement
      // Update the decorator position when document changes
    },
    [editor]
  );

  return {
    addHighlight,
    removeHighlight,
    updateHighlight,
  };
}
