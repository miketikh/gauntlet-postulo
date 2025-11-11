/**
 * AI Service
 * Handles AI integration for demand letter generation with streaming
 * Based on architecture.md AI integration patterns using Vercel AI SDK
 */

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { Template } from '../db/schema';
import { buildPrompt, validatePromptSize, getRecommendedPromptType, PromptType } from './prompt.service';

// Model configuration - Using OpenAI GPT-4.1-mini as specified
// Architecture.md specifies using Vercel AI SDK for better agentic functionality
const MODEL = 'gpt-4.1-mini';

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
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
      },
      model: MODEL,
      duration,
    };
  } catch (error) {
    // Handle AI SDK errors
    if (error instanceof Error) {
      throw new Error(`AI generation error: ${error.message}`);
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
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
      },
      model: MODEL,
      duration,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AI refinement error: ${error.message}`);
    }
    throw error;
  }
}
