/**
 * Auto-Save Plugin
 * Automatically saves editor content after delay or on typing pause
 * Part of Story 4.1 - Integrate Rich Text Editor
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isParagraphNode } from 'lexical';

export interface AutoSavePluginProps {
  onSave: (content: string) => Promise<void>;
  delay?: number; // milliseconds
  onContentChange?: (content: string) => void;
}

export function AutoSavePlugin({
  onSave,
  delay = 30000, // 30 seconds default
  onContentChange,
}: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');

  useEffect(() => {
    const saveContent = async (content: string) => {
      if (content !== lastSavedContentRef.current) {
        try {
          await onSave(content);
          lastSavedContentRef.current = content;
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    };

    const unregisterListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        // Only trigger save if content actually changed
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return;
        }

        editorState.read(() => {
          const root = $getRoot();
          const content = JSON.stringify(editorState.toJSON());

          // Notify parent of content change
          if (onContentChange) {
            onContentChange(content);
          }

          // Clear existing timeout
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          // Set new timeout for auto-save
          saveTimeoutRef.current = setTimeout(() => {
            saveContent(content);
          }, delay);
        });
      }
    );

    return () => {
      unregisterListener();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, delay, onSave, onContentChange]);

  return null;
}
