/**
 * Initial Content Plugin
 * Initializes the Lexical editor with plain text content when the editor is empty
 * This allows populating the editor from database plain_text field
 */

'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

export interface InitialContentPluginProps {
  /**
   * Plain text content to initialize the editor with
   */
  initialContent?: string;
}

/**
 * Plugin that populates an empty Lexical editor with plain text content
 *
 * This runs once when the editor mounts. If the editor is empty and initialContent
 * is provided, it converts the plain text to Lexical nodes (paragraphs and text).
 *
 * The Yjs collaboration plugin will then automatically sync this content to the Yjs document.
 */
export function InitialContentPlugin({ initialContent }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!initialContent || !initialContent.trim()) {
      return;
    }

    // Check if editor is already populated
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();

      // Only populate if editor is empty
      if (!firstChild || (root.getChildrenSize() === 1 && firstChild.getTextContent().trim() === '')) {
        console.log('[InitialContentPlugin] Editor is empty, initializing with content...');

        editor.update(() => {
          const root = $getRoot();

          // Clear any existing content
          root.clear();

          // Split content by double newlines to create paragraphs
          const paragraphs = initialContent
            .split(/\n{2,}/)
            .map((para) => para.trim())
            .filter((para) => para.length > 0);

          console.log(`[InitialContentPlugin] Creating ${paragraphs.length} paragraphs`);

          // Create a paragraph node for each block of text
          paragraphs.forEach((paragraphText) => {
            const paragraphNode = $createParagraphNode();
            const textNode = $createTextNode(paragraphText);
            paragraphNode.append(textNode);
            root.append(paragraphNode);
          });

          console.log('[InitialContentPlugin] Content initialized successfully');
        });
      } else {
        console.log('[InitialContentPlugin] Editor already has content, skipping initialization');
      }
    });
  }, [editor, initialContent]);

  return null;
}
