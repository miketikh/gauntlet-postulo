/**
 * Refinement Context Menu Plugin
 * Adds "Refine with AI" option to editor context menu when text is selected
 * Part of Story 5.1 - Design AI Refinement UI with Section Selection
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sparkles, Copy, Scissors, ClipboardPaste } from 'lucide-react';
import { mergeRegister } from '@lexical/utils';

export interface RefinementContextMenuPluginProps {
  /**
   * Callback when "Refine with AI" is selected
   */
  onRefineWithAI: (selectedText: string) => void;

  /**
   * Whether refinement is enabled
   */
  enabled?: boolean;
}

/**
 * Get selected text from the editor
 */
function getSelectedText(editor: any): string {
  let selectedText = '';

  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selectedText = selection.getTextContent();
    }
  });

  return selectedText;
}

/**
 * Context Menu Plugin for Refinement
 *
 * This plugin adds a context menu (right-click menu) to the Lexical editor
 * that includes a "Refine with AI" option when text is selected.
 *
 * Features:
 * - Appears on right-click when text is selected
 * - Shows "Refine with AI" option with icon
 * - Includes standard context menu items (copy, cut, paste)
 * - Keyboard accessible
 */
export function RefinementContextMenuPlugin({
  onRefineWithAI,
  enabled = true,
}: RefinementContextMenuPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  // Handle context menu (right-click)
  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      if (!enabled) {
        return;
      }

      const text = getSelectedText(editor);

      // Only show context menu if text is selected
      if (text.trim().length === 0) {
        setContextMenuPosition(null);
        setIsOpen(false);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setSelectedText(text);
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
      setIsOpen(true);
    },
    [editor, enabled]
  );

  // Handle refine action
  const handleRefine = useCallback(() => {
    if (selectedText.trim()) {
      onRefineWithAI(selectedText);
    }
    setIsOpen(false);
    setContextMenuPosition(null);
  }, [selectedText, onRefineWithAI]);

  // Handle copy
  const handleCopy = useCallback(() => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
    }
    setIsOpen(false);
  }, [selectedText]);

  // Handle cut
  const handleCut = useCallback(() => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.removeText();
        }
      });
    }
    setIsOpen(false);
  }, [selectedText, editor]);

  // Handle paste
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(text);
          }
        });
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
    setIsOpen(false);
  }, [editor]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
      setContextMenuPosition(null);
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Set up context menu listener
  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) {
      return;
    }

    editorElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [editor, handleContextMenu]);

  // Track selection changes
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const text = getSelectedText(editor);
          setSelectedText(text);
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  // Render context menu at cursor position
  if (!isOpen || !contextMenuPosition) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: contextMenuPosition.y,
        left: contextMenuPosition.x,
        zIndex: 50,
      }}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="hidden" aria-label="Context menu" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem
            onClick={handleRefine}
            className="cursor-pointer"
          >
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span>Refine with AI</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCut} className="cursor-pointer">
            <Scissors className="mr-2 h-4 w-4" />
            <span>Cut</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handlePaste} className="cursor-pointer">
            <ClipboardPaste className="mr-2 h-4 w-4" />
            <span>Paste</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
