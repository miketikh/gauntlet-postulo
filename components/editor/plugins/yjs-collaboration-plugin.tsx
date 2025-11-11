/**
 * Yjs Collaboration Plugin
 * Binds Lexical editor to Yjs document for CRDT-based sync
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 */

'use client';

import React, { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createBinding } from '@lexical/yjs';
import * as Y from 'yjs';

export interface YjsCollaborationPluginProps {
  /**
   * The Yjs document to bind to the editor
   */
  ydoc: Y.Doc;

  /**
   * Name of the XmlFragment in the Yjs document to use for the editor content
   * Defaults to 'root'
   */
  fragmentName?: string;

  /**
   * Callback when the Yjs document updates
   * Can be used to trigger saves to the database
   */
  onYjsUpdate?: (update: Uint8Array, origin: any) => void;
}

/**
 * Plugin that syncs Lexical editor state with a Yjs document
 *
 * This plugin:
 * 1. Creates a binding between the Lexical editor and Y.Doc
 * 2. Sets up two-way sync between editor edits and Yjs updates
 * 3. Automatically updates the Yjs document when the editor changes
 * 4. Automatically updates the editor when the Yjs document changes
 *
 * The binding uses Y.XmlText which is the recommended shared type
 * for rich text editors like Lexical.
 */
export function YjsCollaborationPlugin({
  ydoc,
  fragmentName = 'root',
  onYjsUpdate,
}: YjsCollaborationPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Get or create the XmlText for the editor content
    const yText = ydoc.get(fragmentName, Y.XmlText) as Y.XmlText;

    // Create the binding which handles two-way sync
    const binding = createBinding(editor, yText, new Set());

    // Register update listener on the Yjs document
    if (onYjsUpdate) {
      const updateHandler = (update: Uint8Array, origin: any) => {
        onYjsUpdate(update, origin);
      };
      ydoc.on('update', updateHandler);

      // Cleanup
      return () => {
        ydoc.off('update', updateHandler);
        binding.destroy();
      };
    }

    // Cleanup on unmount
    return () => {
      binding.destroy();
    };
  }, [editor, ydoc, fragmentName, onYjsUpdate]);

  return null;
}
