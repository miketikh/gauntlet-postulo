/**
 * Refinement Panel Component Tests
 * Tests for Story 5.1 - Design AI Refinement UI with Section Selection
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefinementPanel } from '../refinement-panel';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

describe('RefinementPanel', () => {
  const mockSelectedText = 'The defendant failed to maintain proper safety protocols, resulting in the incident.';
  const mockOnClose = vi.fn();
  const mockOnRefine = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={false}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      expect(screen.getByText('Refine with AI')).toBeInTheDocument();
    });

    it('should display selected text', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      expect(screen.getByText(mockSelectedText)).toBeInTheDocument();
    });

    it('should display word count', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      // "The defendant failed to maintain proper safety protocols, resulting in the incident." = 13 words
      expect(screen.getByText(/13 words/i)).toBeInTheDocument();
    });

    it('should display character count', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      const charCount = mockSelectedText.length;
      expect(screen.getByText(new RegExp(`${charCount} characters?`, 'i'))).toBeInTheDocument();
    });
  });

  describe('Quick Actions Tab', () => {
    it('should display all quick action buttons', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      expect(screen.getByText('Make More Assertive')).toBeInTheDocument();
      expect(screen.getByText('Add More Detail')).toBeInTheDocument();
      expect(screen.getByText('Shorten This Section')).toBeInTheDocument();
      expect(screen.getByText('Emphasize Liability')).toBeInTheDocument();
      expect(screen.getByText('Soften Tone')).toBeInTheDocument();
      expect(screen.getByText('Improve Clarity')).toBeInTheDocument();
    });

    it('should populate instruction when quick action is clicked', async () => {
      const user = userEvent.setup();

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      // Click "Make More Assertive" button
      const assertiveButton = screen.getByText('Make More Assertive');
      await user.click(assertiveButton);

      // Switch to custom tab to see the instruction
      const customTab = screen.getByText('Custom Instructions');
      await user.click(customTab);

      // Check that the instruction was populated
      const textarea = screen.getByPlaceholderText('Describe how to improve this section...');
      expect(textarea).toHaveValue(expect.stringContaining('assertive'));
    });

    it('should highlight selected quick action button', async () => {
      const user = userEvent.setup();

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      const assertiveButton = screen.getByText('Make More Assertive');
      await user.click(assertiveButton);

      // Check if button has selected styling (variant="default")
      expect(assertiveButton.closest('button')).toHaveClass('bg-primary');
    });
  });

  describe('Custom Instructions Tab', () => {
    it('should switch to custom instructions tab', async () => {
      const user = userEvent.setup();

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      const customTab = screen.getByText('Custom Instructions');
      await user.click(customTab);

      const textarea = screen.getByPlaceholderText('Describe how to improve this section...');
      expect(textarea).toBeInTheDocument();
    });

    it('should allow typing custom instructions', async () => {
      const user = userEvent.setup();
      const customInstruction = 'Make this more concise and focus on key facts.';

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      const customTab = screen.getByText('Custom Instructions');
      await user.click(customTab);

      const textarea = screen.getByPlaceholderText('Describe how to improve this section...');
      await user.type(textarea, customInstruction);

      expect(textarea).toHaveValue(customInstruction);
    });

    it('should clear selected quick action when typing custom instruction', async () => {
      const user = userEvent.setup();

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      // Select a quick action first
      const assertiveButton = screen.getByText('Make More Assertive');
      await user.click(assertiveButton);

      // Switch to custom tab and type
      const customTab = screen.getByText('Custom Instructions');
      await user.click(customTab);

      const textarea = screen.getByPlaceholderText('Describe how to improve this section...');
      await user.clear(textarea);
      await user.type(textarea, 'Custom instruction');

      // Go back to quick actions tab
      const quickTab = screen.getByText('Quick Actions');
      await user.click(quickTab);

      // Verify no quick action is selected
      const buttons = screen.getAllByRole('button');
      const quickActionButtons = buttons.filter(btn =>
        btn.textContent?.includes('Make More Assertive') ||
        btn.textContent?.includes('Add More Detail')
      );

      quickActionButtons.forEach(btn => {
        expect(btn).not.toHaveClass('bg-primary');
      });
    });
  });

  describe('Actions', () => {
    it('should call onRefine with instruction when Apply button is clicked', async () => {
      const user = userEvent.setup();
      const customInstruction = 'Make this more professional.';

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      // Type custom instruction
      const customTab = screen.getByText('Custom Instructions');
      await user.click(customTab);

      const textarea = screen.getByPlaceholderText('Describe how to improve this section...');
      await user.type(textarea, customInstruction);

      // Click apply
      const applyButton = screen.getByText('Apply Refinement');
      await user.click(applyButton);

      expect(mockOnRefine).toHaveBeenCalledWith(customInstruction, undefined);
    });

    it('should call onRefine with quick action ID when applying quick action', async () => {
      const user = userEvent.setup();

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      // Select quick action
      const assertiveButton = screen.getByText('Make More Assertive');
      await user.click(assertiveButton);

      // Click apply
      const applyButton = screen.getByText('Apply Refinement');
      await user.click(applyButton);

      expect(mockOnRefine).toHaveBeenCalledWith(
        expect.stringContaining('assertive'),
        'assertive'
      );
    });

    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      const closeButton = screen.getByLabelText('Close refinement panel');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable Apply button when instruction is empty', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      const applyButton = screen.getByText('Apply Refinement');
      expect(applyButton).toBeDisabled();
    });

    it('should disable buttons when isRefining is true', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
          isRefining={true}
        />
      );

      const applyButton = screen.getByText('Refining...');
      const cancelButton = screen.getByText('Cancel');
      const closeButton = screen.getByLabelText('Close refinement panel');

      expect(applyButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      expect(closeButton).toBeDisabled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close panel when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should apply refinement when Cmd+Enter is pressed', async () => {
      const user = userEvent.setup();
      const customInstruction = 'Test instruction';

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      // Type instruction
      const customTab = screen.getByText('Custom Instructions');
      await user.click(customTab);

      const textarea = screen.getByPlaceholderText('Describe how to improve this section...');
      await user.type(textarea, customInstruction);

      // Press Cmd+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(mockOnRefine).toHaveBeenCalledWith(customInstruction, null);
    });

    it('should apply refinement when Ctrl+Enter is pressed', async () => {
      const user = userEvent.setup();
      const customInstruction = 'Test instruction';

      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      // Type instruction
      const customTab = screen.getByText('Custom Instructions');
      await user.click(customTab);

      const textarea = screen.getByPlaceholderText('Describe how to improve this section...');
      await user.type(textarea, customInstruction);

      // Press Ctrl+Enter
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(mockOnRefine).toHaveBeenCalledWith(customInstruction, null);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      expect(screen.getByLabelText('Close refinement panel')).toBeInTheDocument();
      expect(screen.getByLabelText('Custom refinement instructions')).toBeInTheDocument();
    });

    it('should display keyboard shortcuts hint', () => {
      render(
        <RefinementPanel
          selectedText={mockSelectedText}
          isOpen={true}
          onClose={mockOnClose}
          onRefine={mockOnRefine}
        />
      );

      expect(screen.getByText(/Esc.*to cancel/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter.*to apply/i)).toBeInTheDocument();
    });
  });
});
