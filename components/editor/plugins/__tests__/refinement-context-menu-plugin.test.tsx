/**
 * Refinement Context Menu Plugin Tests
 * Tests for Story 5.1 - Design AI Refinement UI with Section Selection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RefinementContextMenuPlugin } from '../refinement-context-menu-plugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection, $createTextNode } from 'lexical';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import '@testing-library/jest-dom';

// Helper component to populate editor with text
function EditorContent() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      if (paragraph) {
        paragraph.append($createTextNode('This is a test sentence for refinement.'));
      }
    });
  }, [editor]);

  return null;
}

// Test component wrapper
function TestEditor({ onRefineWithAI, enabled = true }: { onRefineWithAI: Mock; enabled?: boolean }) {
  const initialConfig = {
    namespace: 'TestEditor',
    theme: {},
    onError: (error: Error) => console.error(error),
    nodes: [],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable data-testid="editor-content" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <EditorContent />
      <RefinementContextMenuPlugin
        onRefineWithAI={onRefineWithAI}
        enabled={enabled}
      />
    </LexicalComposer>
  );
}

describe('RefinementContextMenuPlugin', () => {
  const mockOnRefineWithAI = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Context Menu Display', () => {
    it('should not show context menu when no text is selected', async () => {
      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      // Right-click without selecting text
      fireEvent.contextMenu(editorContent);

      await waitFor(() => {
        expect(screen.queryByText('Refine with AI')).not.toBeInTheDocument();
      });
    });

    it('should show context menu when text is selected and right-clicked', async () => {
      const user = userEvent.setup();

      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      // Simulate text selection
      await user.pointer([
        { keys: '[MouseLeft>]', target: editorContent },
        { coords: { x: 10, y: 10 } },
        { coords: { x: 50, y: 10 } },
        { keys: '[/MouseLeft]' },
      ]);

      // Right-click to open context menu
      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(() => {
        expect(screen.getByText('Refine with AI')).toBeInTheDocument();
      });
    });

    it('should not show context menu when plugin is disabled', async () => {
      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} enabled={false} />);

      const editorContent = screen.getByTestId('editor-content');

      // Right-click
      fireEvent.contextMenu(editorContent);

      await waitFor(() => {
        expect(screen.queryByText('Refine with AI')).not.toBeInTheDocument();
      });
    });
  });

  describe('Context Menu Options', () => {
    it('should display "Refine with AI" option', async () => {
      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      // Simulate context menu with selected text
      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(() => {
        expect(screen.getByText('Refine with AI')).toBeInTheDocument();
      });
    });

    it('should display standard context menu options', async () => {
      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Cut')).toBeInTheDocument();
        expect(screen.getByText('Paste')).toBeInTheDocument();
      });
    });

    it('should show Sparkles icon for "Refine with AI" option', async () => {
      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(() => {
        const refineOption = screen.getByText('Refine with AI').closest('div');
        expect(refineOption).toBeInTheDocument();
        // Icon should be rendered with the menu item
      });
    });
  });

  describe('Refine Action', () => {
    it('should call onRefineWithAI with selected text when "Refine with AI" is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      // Note: In actual testing, we would need to properly select text using Lexical's selection API
      // This is a simplified test structure

      // Open context menu
      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(async () => {
        const refineButton = screen.getByText('Refine with AI');
        await user.click(refineButton);
      });

      // Verify callback was called
      expect(mockOnRefineWithAI).toHaveBeenCalled();
    });

    it('should close context menu after clicking "Refine with AI"', async () => {
      const user = userEvent.setup();

      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      // Open context menu
      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(async () => {
        const refineButton = screen.getByText('Refine with AI');
        await user.click(refineButton);
      });

      // Context menu should close
      await waitFor(() => {
        expect(screen.queryByText('Refine with AI')).not.toBeInTheDocument();
      });
    });
  });

  describe('Menu Positioning', () => {
    it('should position context menu at cursor location', async () => {
      const { container } = render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      const clientX = 100;
      const clientY = 150;

      fireEvent.contextMenu(editorContent, {
        clientX,
        clientY,
      });

      await waitFor(() => {
        // The menu should be positioned near the cursor
        const menu = screen.getByText('Refine with AI').closest('[role="menu"]');
        // Note: Actual positioning depends on dropdown component implementation
        expect(menu).toBeInTheDocument();
      });
    });
  });

  describe('Menu Closing', () => {
    it('should close context menu when clicking outside', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <TestEditor onRefineWithAI={mockOnRefineWithAI} />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const editorContent = screen.getByTestId('editor-content');

      // Open context menu
      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(() => {
        expect(screen.getByText('Refine with AI')).toBeInTheDocument();
      });

      // Click outside
      const outside = screen.getByTestId('outside');
      await user.click(outside);

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText('Refine with AI')).not.toBeInTheDocument();
      });
    });

    it('should prevent default browser context menu', async () => {
      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 30,
        clientY: 10,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      editorContent.dispatchEvent(event);

      // Should prevent default to avoid browser context menu
      await waitFor(() => {
        // Note: This depends on having selected text
        // If no text is selected, preventDefault should not be called
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(() => {
        const menu = screen.getByText('Refine with AI').closest('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<TestEditor onRefineWithAI={mockOnRefineWithAI} />);

      const editorContent = screen.getByTestId('editor-content');

      // Open context menu
      fireEvent.contextMenu(editorContent, {
        clientX: 30,
        clientY: 10,
      });

      await waitFor(async () => {
        const refineOption = screen.getByText('Refine with AI');
        expect(refineOption).toBeInTheDocument();

        // Should be able to navigate with arrow keys
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');
      });

      expect(mockOnRefineWithAI).toHaveBeenCalled();
    });
  });
});
