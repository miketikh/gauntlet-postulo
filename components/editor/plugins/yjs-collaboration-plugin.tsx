/**
 * Yjs Collaboration Plugin
 * Provides full two-way sync between Lexical editor and Yjs document
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 *
 * Implements proper binding using @lexical/yjs for real-time collaboration.
 */

'use client';

import React, { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  createBinding,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
  type Binding
} from '@lexical/yjs';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

/**
 * Simple Awareness mock for tests without actual WebSocket
 * Implements minimal interface required by Lexical Yjs binding
 */
class MockAwareness {
  private localState: any = {};

  getLocalState() {
    return this.localState;
  }

  setLocalState(state: any) {
    this.localState = state;
  }

  setLocalStateField(field: string, value: any) {
    this.localState[field] = value;
  }

  getStates() {
    return new Map();
  }

  on() {}
  off() {}
  destroy() {}
}

export interface YjsCollaborationPluginProps {
  /**
   * The Yjs document to bind to the editor
   */
  ydoc: Y.Doc;

  /**
   * Name of the shared type in the Yjs document
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
 * Yjs Collaboration Plugin with Full Two-Way Sync
 *
 * This plugin:
 * 1. Creates a binding between Lexical editor and Yjs document
 * 2. Syncs Lexical changes to Yjs (user typing → Yjs updates)
 * 3. Syncs Yjs changes to Lexical (remote changes → editor updates)
 * 4. Enables real-time collaborative editing with CRDT conflict resolution
 */
export function YjsCollaborationPlugin({
  ydoc,
  fragmentName = 'root',
  onYjsUpdate,
}: YjsCollaborationPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Guard against null/undefined ydoc
    if (!ydoc) {
      console.warn('YjsCollaborationPlugin: ydoc is null or undefined');
      return;
    }

    // Create a simple provider object (required by binding API)
    // For tests without actual WebSocket, we use a mock provider with MockAwareness
    const provider = {
      awareness: new MockAwareness(),
      connect: () => {},
      disconnect: () => {},
      on: () => {},
      off: () => {},
    };

    // Create the Yjs-Lexical binding
    // This connects the Lexical editor to the Yjs document
    const docMap = new Map<string, Y.Doc>([[fragmentName, ydoc]]);
    const binding: Binding = createBinding(
      editor,
      provider,
      fragmentName,
      ydoc,
      docMap
    );

    // Register Lexical editor update listener
    // This syncs Lexical changes → Yjs document
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyElements, dirtyLeaves, normalizedNodes, tags }) => {
        if (tags.has('skip-collab') || tags.has('historic')) {
          return;
        }

        syncLexicalUpdateToYjs(
          binding,
          provider,
          prevEditorState,
          editorState,
          dirtyElements,
          dirtyLeaves,
          normalizedNodes,
          tags
        );
      }
    );

    // Register Yjs document observer
    // This syncs Yjs changes → Lexical editor
    const yXmlText = ydoc.get(fragmentName, Y.XmlText) as Y.XmlText;
    const observer = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
      // Skip updates that originated from this editor
      if (transaction.origin === binding) {
        return;
      }

      syncYjsChangesToLexical(binding, provider, events, false);
    };
    yXmlText.observeDeep(observer);

    // Register Yjs update listener for onYjsUpdate callback
    let updateHandler: ((update: Uint8Array, origin: any) => void) | null = null;
    if (onYjsUpdate) {
      updateHandler = (update: Uint8Array, origin: any) => {
        onYjsUpdate(update, origin);
      };
      ydoc.on('update', updateHandler);
    }

    // Cleanup
    return () => {
      removeUpdateListener();
      yXmlText.unobserveDeep(observer);
      if (updateHandler) {
        ydoc.off('update', updateHandler);
      }
    };
  }, [editor, ydoc, fragmentName, onYjsUpdate]);

  return null;
}
