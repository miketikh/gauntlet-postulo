/**
 * useRefineDraft Hook
 * Handles AI refinement with streaming for draft text selections
 * Story 5.4 - Preview & Apply UI
 */

import { useState, useCallback } from 'react';

/**
 * Refinement request payload
 */
export interface RefineRequest {
  draftId: string;
  selectedText: string;
  instruction: string;
  quickActionId?: string;
  context?: {
    plaintiffName?: string;
    defendantName?: string;
    caseDescription?: string;
    documentType?: string;
  };
}

/**
 * Refinement result metadata
 */
export interface RefinementMetadata {
  refinementId: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  duration: number;
}

/**
 * Refinement state
 */
export interface RefinementState {
  isRefining: boolean;
  refinedText: string;
  error: string | null;
  metadata: RefinementMetadata | null;
}

/**
 * Hook for refining draft text with AI streaming
 *
 * Provides functionality to send refinement requests and handle streaming responses.
 *
 * @example
 * ```tsx
 * const { refine, state, reset } = useRefineDraft();
 *
 * const handleRefine = async () => {
 *   await refine({
 *     draftId: 'draft-id-123',
 *     selectedText: 'Original text...',
 *     instruction: 'Make more assertive',
 *     quickActionId: 'make-assertive',
 *   });
 *
 *   // state.refinedText will contain the result
 *   // state.isRefining will be true during generation
 * };
 * ```
 */
export function useRefineDraft() {
  const [state, setState] = useState<RefinementState>({
    isRefining: false,
    refinedText: '',
    error: null,
    metadata: null,
  });

  /**
   * Refine text with streaming
   */
  const refine = useCallback(async (request: RefineRequest) => {
    setState({
      isRefining: true,
      refinedText: '',
      error: null,
      metadata: null,
    });

    try {
      const response = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // Handle non-streaming error response
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Refinement request failed');
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Process streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix

            if (data.type === 'content') {
              // Accumulate text chunks
              fullText += data.text;
              setState((prev) => ({
                ...prev,
                refinedText: fullText,
              }));
            } else if (data.type === 'done') {
              // Refinement complete
              setState((prev) => ({
                ...prev,
                isRefining: false,
                metadata: data.metadata,
              }));
            } else if (data.type === 'error') {
              // Error occurred during streaming
              throw new Error(data.error);
            }
          } catch (parseError) {
            console.error('Failed to parse SSE data:', line, parseError);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState((prev) => ({
        ...prev,
        isRefining: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Reset refinement state
   */
  const reset = useCallback(() => {
    setState({
      isRefining: false,
      refinedText: '',
      error: null,
      metadata: null,
    });
  }, []);

  return {
    refine,
    reset,
    state,
    isRefining: state.isRefining,
    refinedText: state.refinedText,
    error: state.error,
    metadata: state.metadata,
  };
}
