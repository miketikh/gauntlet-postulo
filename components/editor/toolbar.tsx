/**
 * Editor Toolbar Component
 * Formatting controls for Lexical editor
 * Part of Story 4.1 - Integrate Rich Text Editor
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
} from 'lexical';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListNode,
} from '@lexical/list';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

const HEADING_LEVELS: { label: string; value: HeadingTagType }[] = [
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'H5', value: 'h5' },
  { label: 'H6', value: 'h6' },
];

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      const elementDOM = editor.getElementByKey(element.getKey());
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        1
      )
    );
  }, [editor, updateToolbar]);

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  return (
    <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Formatting toolbar">
      {/* Undo/Redo */}
      <div className="flex gap-1 pr-2 border-r">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Formatting */}
      <div className="flex gap-1 pr-2 border-r">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => formatText('bold')}
          className={cn(isBold && 'bg-accent')}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          aria-pressed={isBold}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => formatText('italic')}
          className={cn(isItalic && 'bg-accent')}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          aria-pressed={isItalic}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => formatText('underline')}
          className={cn(isUnderline && 'bg-accent')}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
          aria-pressed={isUnderline}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => formatText('strikethrough')}
          className={cn(isStrikethrough && 'bg-accent')}
          title="Strikethrough"
          aria-label="Strikethrough"
          aria-pressed={isStrikethrough}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      {/* Headings */}
      <div className="flex gap-1 pr-2 border-r">
        {HEADING_LEVELS.map(({ label, value }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            onClick={() => formatHeading(value)}
            className={cn(blockType === value && 'bg-accent')}
            title={`${label} Heading`}
            aria-label={`${label} Heading`}
            aria-pressed={blockType === value}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Lists and Quotes */}
      <div className="flex gap-1 pr-2 border-r">
        <Button
          variant="ghost"
          size="icon"
          onClick={formatBulletList}
          className={cn(blockType === 'ul' && 'bg-accent')}
          title="Bullet List"
          aria-label="Bullet List"
          aria-pressed={blockType === 'ul'}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={formatNumberedList}
          className={cn(blockType === 'ol' && 'bg-accent')}
          title="Numbered List"
          aria-label="Numbered List"
          aria-pressed={blockType === 'ol'}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={formatQuote}
          className={cn(blockType === 'quote' && 'bg-accent')}
          title="Block Quote"
          aria-label="Block Quote"
          aria-pressed={blockType === 'quote'}
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Alignment */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => formatAlignment('left')}
          title="Align Left"
          aria-label="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => formatAlignment('center')}
          title="Align Center"
          aria-label="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => formatAlignment('right')}
          title="Align Right"
          aria-label="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => formatAlignment('justify')}
          title="Justify"
          aria-label="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
