/**
 * AI Service
 * Handles Claude API integration for demand letter generation with streaming
 * Based on architecture.md AI integration patterns
 */

import Anthropic from '@anthropic-ai/sdk';
import { Template } from '../db/schema';
import { buildPrompt, validatePromptSize, getRecommendedPromptType, PromptType } from './prompt.service';

// Claude model configuration (architecture.md specifies Claude 3.5 Sonnet)
const MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 4096;

/**
 * Get or create Anthropic client instance
 * Lazy initialization to avoid issues in test environments
 */
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return anthropicClient;
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
 * Generate demand letter using Claude API with streaming
 *
 * This async generator yields text chunks as they arrive from Claude,
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
  template: Template,
  variables: Record<string, any>
): AsyncGenerator<string, GenerationMetadata, undefined> {
  // Determine prompt type (from template metadata or auto-detect)
  const promptType = getRecommendedPromptType(template, variables);

  // Build prompt using specialized template
  const prompt = buildPrompt(promptType, sourceText, template, variables);

  // Validate prompt size
  const validation = validatePromptSize(prompt);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  console.log(`[AI Service] Using ${promptType} prompt (estimated ${validation.tokenCount} tokens)`);

  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const anthropic = getAnthropicClient();

    // Create streaming message with Claude
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    // Process stream events
    for await (const event of stream) {
      // Handle different event types from the stream
      if (event.type === 'content_block_delta') {
        // Text delta - yield the chunk to caller
        if (event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      } else if (event.type === 'message_start') {
        // Capture input token count
        inputTokens = event.message.usage.input_tokens;
      } else if (event.type === 'message_delta') {
        // Capture output token count
        if (event.usage) {
          outputTokens = event.usage.output_tokens;
        }
      }
    }

    const duration = Date.now() - startTime;

    // Return final metadata
    return {
      tokenUsage: { inputTokens, outputTokens },
      model: MODEL,
      duration,
    };
  } catch (error) {
    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error (${error.status}): ${error.message}`);
    }
    throw error;
  }
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
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const anthropic = getAnthropicClient();

    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      } else if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens;
      } else if (event.type === 'message_delta') {
        if (event.usage) {
          outputTokens = event.usage.output_tokens;
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      tokenUsage: { inputTokens, outputTokens },
      model: MODEL,
      duration,
    };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error (${error.status}): ${error.message}`);
    }
    throw error;
  }
}
