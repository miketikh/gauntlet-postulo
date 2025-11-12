/**
 * Refinement Panel V2 Tests
 * Tests preview mode and streaming functionality
 * Story 5.4 - Preview & Apply UI
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RefinementPanelV2 } from '../refinement-panel-v2';
import { useRefineDraft } from '@/lib/hooks/useRefineDraft';

// Mock the hook
vi.mock('@/lib/hooks/useRefineDraft');

describe('RefinementPanelV2', () => {
  const mockOnClose = vi.fn();
  const mockOnApply = vi.fn();
  const mockRefine = vi.fn();
  const mockReset = vi.fn();

  const defaultProps = {
    selectedText: 'The defendant failed to maintain the property properly.',
    isOpen: true,
    onClose: mockOnClose,
    onApply: mockOnApply,
    draftId: 'draft-id-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(useRefineDraft).mockReturnValue({
      refine: mockRefine,
      reset: mockReset,
      state: {
        isRefining: false,
        refinedText: '',
        error: null,
        metadata: null,
      },
      isRefining: false,
      refinedText: '',
      error: null,
      metadata: null,
    });
  });

  describe('Input Mode', () => {
    it('should render selected text and word count', () => {
      render(<RefinementPanelV2 {...defaultProps} />);

      expect(screen.getByText(/The defendant failed to maintain/)).toBeInTheDocument();
      expect(screen.getByText(/8 words/)).toBeInTheDocument();
    });

    it('should display quick action buttons', () => {
      render(<RefinementPanelV2 {...defaultProps} />);

      // Switch to Quick Actions tab if not already there
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);

      expect(screen.getByText('Make More Assertive')).toBeInTheDocument();
      expect(screen.getByText('Add More Detail')).toBeInTheDocument();
      expect(screen.getByText('Shorten This Section')).toBeInTheDocument();
      expect(screen.getByText('Emphasize Liability')).toBeInTheDocument();
      expect(screen.getByText('Soften Tone')).toBeInTheDocument();
      expect(screen.getByText('Improve Clarity')).toBeInTheDocument();
    });

    it('should switch to custom instructions tab', () => {
      render(<RefinementPanelV2 {...defaultProps} />);

      const customTab = screen.getByRole('tab', { name: /Custom Instructions/i });
      fireEvent.click(customTab);

      expect(screen.getByPlaceholderText('Describe how to improve this section...')).toBeInTheDocument();
    });

    it('should call refine when Apply Refinement is clicked', async () => {
      mockRefine.mockResolvedValue(undefined);

      render(<RefinementPanelV2 {...defaultProps} />);

      // Select a quick action
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);

      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);

      // Click Apply Refinement
      const applyButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockRefine).toHaveBeenCalledWith(
          expect.objectContaining({
            draftId: 'draft-id-123',
            selectedText: defaultProps.selectedText,
            quickActionId: 'make-assertive',
          })
        );
      });
    });

    it('should call onClose when Cancel is clicked', () => {
      render(<RefinementPanelV2 {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close when Escape key is pressed in input mode', () => {
      render(<RefinementPanelV2 {...defaultProps} />);

      const card = screen.getByRole('complementary', { name: /Refine with AI/i }) || screen.getByText('Refine with AI').closest('div')?.parentElement;

      if (card) {
        fireEvent.keyDown(card, { key: 'Escape' });
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Preview Mode', () => {
    it('should show preview mode after refinement starts', async () => {
      mockRefine.mockImplementation(() => {
        // Simulate refine starting
        return Promise.resolve();
      });

      render(<RefinementPanelV2 {...defaultProps} />);

      // Select quick action and apply
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);

      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);

      const applyButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Preview Refinement')).toBeInTheDocument();
      });
    });

    it('should display side-by-side comparison in preview mode', async () => {
      mockRefine.mockResolvedValue(undefined);

      // Update mock to return refining state
      vi.mocked(useRefineDraft).mockReturnValue({
        refine: mockRefine,
        reset: mockReset,
        state: {
          isRefining: true,
          refinedText: '',
          error: null,
          metadata: null,
        },
        isRefining: true,
        refinedText: '',
        error: null,
        metadata: null,
      });

      render(<RefinementPanelV2 {...defaultProps} />);

      // Trigger refinement
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);

      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);

      const applyButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
        expect(screen.getByText('Refined')).toBeInTheDocument();
      });
    });

    it('should show streaming text as it arrives', async () => {
      // Start with initial state
      const { rerender } = render(<RefinementPanelV2 {...defaultProps} />);

      // Trigger refinement
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);

      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);

      const applyButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyButton);

      // Simulate streaming text chunks
      vi.mocked(useRefineDraft).mockReturnValue({
        refine: mockRefine,
        reset: mockReset,
        state: {
          isRefining: true,
          refinedText: 'The defendant absolutely ',
          error: null,
          metadata: null,
        },
        isRefining: true,
        refinedText: 'The defendant absolutely ',
        error: null,
        metadata: null,
      });

      rerender(<RefinementPanelV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/The defendant absolutely/)).toBeInTheDocument();
      });
    });

    it('should show metadata after refinement completes', async () => {
      vi.mocked(useRefineDraft).mockReturnValue({
        refine: mockRefine,
        reset: mockReset,
        state: {
          isRefining: false,
          refinedText: 'The defendant absolutely failed to maintain the property.',
          error: null,
          metadata: {
            refinementId: 'refinement-123',
            tokenUsage: { inputTokens: 100, outputTokens: 50 },
            model: 'gpt-4.1-mini',
            duration: 1234,
          },
        },
        isRefining: false,
        refinedText: 'The defendant absolutely failed to maintain the property.',
        error: null,
        metadata: {
          refinementId: 'refinement-123',
          tokenUsage: { inputTokens: 100, outputTokens: 50 },
          model: 'gpt-4.1-mini',
          duration: 1234,
        },
      });

      render(<RefinementPanelV2 {...defaultProps} />);

      // Manually trigger preview mode
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);
      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);
      const applyButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/Tokens: 150/)).toBeInTheDocument();
        expect(screen.getByText(/Duration: 1.2s/)).toBeInTheDocument();
        expect(screen.getByText(/Model: gpt-4.1-mini/)).toBeInTheDocument();
      });
    });

    it('should call onApply when Apply Changes is clicked', async () => {
      const refinedText = 'The defendant absolutely failed to maintain the property.';

      vi.mocked(useRefineDraft).mockReturnValue({
        refine: mockRefine,
        reset: mockReset,
        state: {
          isRefining: false,
          refinedText,
          error: null,
          metadata: {
            refinementId: 'refinement-123',
            tokenUsage: { inputTokens: 100, outputTokens: 50 },
            model: 'gpt-4.1-mini',
            duration: 1000,
          },
        },
        isRefining: false,
        refinedText,
        error: null,
        metadata: {
          refinementId: 'refinement-123',
          tokenUsage: { inputTokens: 100, outputTokens: 50 },
          model: 'gpt-4.1-mini',
          duration: 1000,
        },
      });

      render(<RefinementPanelV2 {...defaultProps} />);

      // Trigger preview mode
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);
      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);
      const applyRefinementButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyRefinementButton);

      await waitFor(() => {
        expect(screen.getByText('Preview Refinement')).toBeInTheDocument();
      });

      const applyChangesButton = screen.getByRole('button', { name: /Apply Changes/i });
      fireEvent.click(applyChangesButton);

      expect(mockOnApply).toHaveBeenCalledWith(refinedText);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset and return to input mode when Refine Again is clicked', async () => {
      vi.mocked(useRefineDraft).mockReturnValue({
        refine: mockRefine,
        reset: mockReset,
        state: {
          isRefining: false,
          refinedText: 'Refined text',
          error: null,
          metadata: null,
        },
        isRefining: false,
        refinedText: 'Refined text',
        error: null,
        metadata: null,
      });

      render(<RefinementPanelV2 {...defaultProps} />);

      // Go to preview mode
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);
      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);
      const applyButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Preview Refinement')).toBeInTheDocument();
      });

      const refineAgainButton = screen.getByRole('button', { name: /Refine Again/i });
      fireEvent.click(refineAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should call onClose when Discard is clicked', async () => {
      vi.mocked(useRefineDraft).mockReturnValue({
        refine: mockRefine,
        reset: mockReset,
        state: {
          isRefining: false,
          refinedText: 'Refined text',
          error: null,
          metadata: null,
        },
        isRefining: false,
        refinedText: 'Refined text',
        error: null,
        metadata: null,
      });

      render(<RefinementPanelV2 {...defaultProps} />);

      // Go to preview mode
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);
      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);
      const applyButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Preview Refinement')).toBeInTheDocument();
      });

      const discardButton = screen.getByRole('button', { name: /Discard/i });
      fireEvent.click(discardButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should display error message if refinement fails', async () => {
      vi.mocked(useRefineDraft).mockReturnValue({
        refine: mockRefine,
        reset: mockReset,
        state: {
          isRefining: false,
          refinedText: '',
          error: 'AI service unavailable',
          metadata: null,
        },
        isRefining: false,
        refinedText: '',
        error: 'AI service unavailable',
        metadata: null,
      });

      render(<RefinementPanelV2 {...defaultProps} />);

      // Go to preview mode
      const quickActionsTab = screen.getByRole('tab', { name: /Quick Actions/i });
      fireEvent.click(quickActionsTab);
      const assertiveButton = screen.getByText('Make More Assertive');
      fireEvent.click(assertiveButton);
      const applyButton = screen.getByRole('button', { name: /Apply Refinement/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('AI service unavailable')).toBeInTheDocument();
      });
    });
  });
});
