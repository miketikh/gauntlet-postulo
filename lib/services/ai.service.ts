/**
 * AI Service
 * Handles AI integration for demand letter generation with streaming
 * Based on architecture.md AI integration patterns using Vercel AI SDK
 */

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { Template } from '../db/schema';
import { buildPrompt, validatePromptSize, getRecommendedPromptType, PromptType } from './prompt.service';
import { AIGenerationError, RateLimitError, TimeoutError } from '../errors';

// Model configuration - Using OpenAI GPT-4.1-mini as specified
// Architecture.md specifies using Vercel AI SDK for better agentic functionality
const MODEL = 'gpt-4.1-mini';

// Story 6.9: Retry configuration for AI requests
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Story 6.9: Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Story 6.9: Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Story 6.9: Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Rate limit errors (429)
  if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
    return true;
  }

  // Temporary server errors (5xx except 501)
  if (error?.status >= 500 && error?.status !== 501) {
    return true;
  }

  // Network errors
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
    return true;
  }

  return false;
}

/**
 * Story 6.9: Handle AI errors with user-friendly messages
 */
function handleAIError(error: any, context: string): never {
  console.error(`AI ${context} error:`, error);

  // Rate limit errors
  if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
    throw new RateLimitError();
  }

  // Timeout errors
  if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
    throw new TimeoutError();
  }

  // Quota exceeded
  if (error?.code === 'insufficient_quota') {
    throw new AIGenerationError(
      'AI usage quota exceeded',
      'Please contact your administrator to increase your AI quota.'
    );
  }

  // Context length exceeded
  if (error?.code === 'context_length_exceeded') {
    throw new AIGenerationError(
      'Document too large for AI processing',
      'Please try with a shorter document or fewer source files.'
    );
  }

  // Generic AI errors
  if (error instanceof Error) {
    throw new AIGenerationError(error.message);
  }

  throw new AIGenerationError('Unknown error occurred during AI generation');
}

/**
 * Request payload for generating demand letters
 */
export interface GenerateRequest {
  projectId: string;
  templateId: string;
  variables: Record<string, any>;
}

/**
 * Metadata returned after generation completes
 */
export interface GenerationMetadata {
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  duration: number;
}

/**
 * Generate demand letter using Vercel AI SDK with streaming
 *
 * This async generator yields text chunks as they arrive from the AI model,
 * and returns metadata about token usage and timing when complete.
 *
 * @param sourceText - Combined text from all source documents
 * @param template - Template structure with sections and variables
 * @param variables - Case-specific variables (plaintiff name, dates, etc.)
 *
 * @example
 * ```typescript
 * const generator = generateDemandLetter(sourceText, template, variables);
 * for await (const chunk of generator) {
 *   if (typeof chunk === 'string') {
 *     // Stream text chunk to client
 *     console.log(chunk);
 *   } else {
 *     // Generation complete, chunk contains metadata
 *     console.log('Token usage:', chunk.tokenUsage);
 *   }
 * }
 * ```
 */
export async function* generateDemandLetter(
  sourceText: string,
  template: Template | null,
  variables: Record<string, any>
): AsyncGenerator<string, GenerationMetadata, undefined> {
  // Determine prompt type (from template metadata or auto-detect)
  const promptType = template ? getRecommendedPromptType(template, variables) : 'base' as PromptType;

  // Build prompt using specialized template
  const prompt = buildPrompt(promptType, sourceText, template, variables);

  // Validate prompt size
  const validation = validatePromptSize(prompt);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  console.log(`[AI Service] Using ${promptType} prompt (estimated ${validation.tokenCount} tokens)`);

  const startTime = Date.now();

  // Story 6.9: Retry logic with exponential backoff
  let lastError: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Stream text generation using Vercel AI SDK
      const result = streamText({
        model: openai(MODEL),
        prompt,
      });

      // Stream text chunks to caller
      for await (const chunk of result.textStream) {
        yield chunk;
      }

      // Get final usage statistics
      const usage = await result.usage;
      const duration = Date.now() - startTime;

      // Return final metadata
      return {
        tokenUsage: {
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
        },
        model: MODEL,
        duration,
      };
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (isRetryableError(error)) {
        // If we have retries left, wait and retry
        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          console.log(`[AI Service] Retrying after ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }
      }

      // If not retryable or out of retries, handle the error
      handleAIError(error, 'generation');
    }
  }

  // This should never be reached, but TypeScript needs it
  handleAIError(lastError, 'generation');
}

/**
 * Construct prompt from template and source documents
 *
 * @deprecated This function has been replaced by the prompt service.
 * Use buildPrompt() from prompt.service.ts instead, which provides:
 * - Specialized prompts for different case types
 * - Token validation and optimization
 * - Better structured output guidance
 *
 * This function is kept for backwards compatibility but should not be used
 * in new code.
 *
 * @param sourceText - Combined text from source documents
 * @param template - Template with sections and variable definitions
 * @param variables - Case-specific variable values
 * @returns Complete prompt for Claude API
 */
export function constructPrompt(
  sourceText: string,
  template: Template,
  variables: Record<string, any>
): string {
  // Redirect to new prompt service
  return buildPrompt('base', sourceText, template, variables);
}

/**
 * Refine a specific section of a demand letter
 *
 * Similar to generateDemandLetter but focuses on improving a single section
 * based on user feedback or additional instructions.
 *
 * @param sectionContent - Current content of the section
 * @param refinementInstructions - User's instructions for refinement
 * @param sourceText - Source documents for reference
 */
export async function* refineSection(
  sectionContent: string,
  refinementInstructions: string,
  sourceText: string
): AsyncGenerator<string, GenerationMetadata, undefined> {
  const prompt = `You are an expert legal assistant helping to refine a section of a demand letter.

# Current Section Content
${sectionContent}

# Refinement Instructions
${refinementInstructions}

# Source Documents (for reference)
${sourceText}

# Instructions
Refine the section above based on the refinement instructions. Maintain the professional legal tone and factual accuracy. Ensure any claims are supported by the source documents.

Generate the refined section now:`;

  const startTime = Date.now();

  // Story 6.9: Retry logic with exponential backoff
  let lastError: any;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Stream text generation using Vercel AI SDK
      const result = streamText({
        model: openai(MODEL),
        prompt,
      });

      // Stream text chunks to caller
      for await (const chunk of result.textStream) {
        yield chunk;
      }

      // Get final usage statistics
      const usage = await result.usage;
      const duration = Date.now() - startTime;

      return {
        tokenUsage: {
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
        },
        model: MODEL,
        duration,
      };
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (isRetryableError(error)) {
        // If we have retries left, wait and retry
        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          console.log(`[AI Service] Retrying refinement after ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }
      }

      // If not retryable or out of retries, handle the error
      handleAIError(error, 'refinement');
    }
  }

  // This should never be reached, but TypeScript needs it
  handleAIError(lastError, 'refinement');
}
