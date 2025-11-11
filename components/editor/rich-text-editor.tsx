/**
 * Rich Text Editor Component
 * Lexical-based editor with formatting toolbar and auto-save
 * Part of Story 4.1 - Integrate Rich Text Editor
 * Updated for Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { EditorToolbar } from './toolbar';
import { AutoSavePlugin } from './plugins/auto-save-plugin';
import { YjsCollaborationPlugin } from './plugins/yjs-collaboration-plugin';
import { PresencePlugin } from './plugins/presence-plugin';
import { RemoteUser } from '@/lib/hooks/use-presence-awareness';
import { cn } from '@/lib/utils/utils';
import * as Y from 'yjs';

export interface RichTextEditorProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  autoSaveDelay?: number; // in milliseconds, default 30000 (30 seconds)
  /**
   * Optional Yjs document for collaborative editing
   * When provided, the editor will sync with this Yjs document
   */
  yjsDocument?: Y.Doc;
  /**
   * Callback when Yjs document updates
   * Receives the binary update data
   */
  onYjsUpdate?: (update: Uint8Array) => void;
  /**
   * Whether presence awareness is enabled
   */
  presenceEnabled?: boolean;
  /**
   * Remote users for presence rendering
   */
  remoteUsers?: RemoteUser[];
  /**
   * Callback when cursor position changes
   */
  onCursorChange?: (cursor: { anchor: number; focus: number } | null) => void;
  /**
   * Callback when user activity is detected
   */
  onActivity?: () => void;
}

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
  },
  code: 'editor-code',
};

export function RichTextEditor({
  initialContent,
  onSave,
  onContentChange,
  placeholder = 'Start typing...',
  className,
  editable = true,
  autoSaveDelay = 30000,
  yjsDocument,
  onYjsUpdate,
  presenceEnabled = false,
  remoteUsers = [],
  onCursorChange,
  onActivity,
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'DemandLetterEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical Error:', error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      LinkNode,
    ],
    editable,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn('relative flex flex-col border rounded-lg bg-background', className)}>
        {editable && (
          <div className="border-b bg-muted/50 p-2">
            <EditorToolbar />
          </div>
        )}

        <div className="relative flex-1 overflow-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input min-h-[400px] p-4 outline-none"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="editor-placeholder absolute top-4 left-4 text-muted-foreground pointer-events-none">
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />

          {/* Yjs Collaboration Plugin */}
          {yjsDocument && (
            <YjsCollaborationPlugin
              ydoc={yjsDocument}
              onYjsUpdate={onYjsUpdate}
            />
          )}

          {/* Presence Plugin */}
          {presenceEnabled && (
            <PresencePlugin
              remoteUsers={remoteUsers}
              onCursorChange={onCursorChange}
              onActivity={onActivity}
            />
          )}

          {/* Auto-save Plugin (only if not using Yjs) */}
          {onSave && !yjsDocument && (
            <AutoSavePlugin
              onSave={onSave}
              delay={autoSaveDelay}
              onContentChange={onContentChange}
            />
          )}
        </div>
      </div>
    </LexicalComposer>
  );
}
