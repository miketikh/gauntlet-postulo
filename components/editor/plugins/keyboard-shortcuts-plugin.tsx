/**
 * Keyboard Shortcuts Plugin
 * Implements keyboard shortcuts for editor commands
 * Part of Story 4.1 - Integrate Rich Text Editor
 */

'use client';

import React, { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  KEY_MODIFIER_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Keyboard shortcuts are built into Lexical by default
    // Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
    // Ctrl+Z for undo, Ctrl+Y / Ctrl+Shift+Z for redo
    // We can add custom shortcuts here if needed

    const removeKeyCommand = editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event: KeyboardEvent = payload;
        const { key } = event;

        // Example custom shortcuts can be added here
        // For now, we rely on Lexical's built-in shortcuts

        return false; // Allow default handling
      },
      COMMAND_PRIORITY_NORMAL
    );

    return () => {
      removeKeyCommand();
    };
  }, [editor]);

  return null;
}
