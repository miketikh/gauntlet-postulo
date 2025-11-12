/**
 * Refinement Service
 * Handles AI refinement of text selections with streaming
 * Story 5.3 - Custom Prompt Refinement API
 */

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { buildRefinementPrompt, isValidQuickActionId, RefinementContext, QuickActionId } from '../prompts/refinement-quick-actions';
import { db } from '../db/client';
import { aiRefinements, drafts } from '../db/schema';
import { eq } from 'drizzle-orm';

// Model configuration - Using OpenAI GPT-4.1-mini as specified in ai.service.ts
const MODEL = 'gpt-4.1-mini';

/**
 * Refinement request payload
 */
export interface RefineTextRequest {
  draftId: string;
  selectedText: string;
  instruction: string;
  quickActionId?: string;
  context?: RefinementContext;
}

/**
 * Refinement metadata returned after completion
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
 * Refine selected text using AI with streaming
 *
 * This async generator yields text chunks as they arrive from the AI model,
 * and returns metadata about token usage and timing when complete.
 *
 * @param request - Refinement request with selected text and instructions
 * @param userId - ID of user requesting refinement (for audit trail)
 *
 * @example
 * ```typescript
 * const generator = refineText({
 *   draftId: 'uuid',
 *   selectedText: 'The defendant failed to maintain...',
 *   instruction: 'Make more assertive',
 *   quickActionId: 'make-assertive'
 * }, userId);
 *
 * for await (const chunk of generator) {
 *   if (typeof chunk === 'string') {
 *     // Stream text chunk to client
 *     console.log(chunk);
 *   } else {
 *     // Refinement complete, chunk contains metadata
 *     console.log('Token usage:', chunk.tokenUsage);
 *   }
 * }
 * ```
 */
export async function* refineText(
  request: RefineTextRequest,
  userId: string
): AsyncGenerator<string, RefinementMetadata, undefined> {
  const { draftId, selectedText, instruction, quickActionId, context } = request;

  // Build prompt based on quick action or custom instruction
  let prompt: string;

  if (quickActionId && isValidQuickActionId(quickActionId)) {
    // Use quick action prompt template
    prompt = buildRefinementPrompt(
      quickActionId as QuickActionId,
      selectedText,
      context || {}
    );
  } else {
    // Use custom instruction with basic template
    prompt = buildCustomRefinementPrompt(selectedText, instruction, context);
  }

  const startTime = Date.now();

  try {
    // Stream text generation using Vercel AI SDK
    const result = streamText({
      model: openai(MODEL),
      prompt,
    });

    let fullRefinedText = '';

    // Stream text chunks to caller
    for await (const chunk of result.textStream) {
      fullRefinedText += chunk;
      yield chunk;
    }

    // Get final usage statistics
    const usage = await result.usage;
    const duration = Date.now() - startTime;

    // Save refinement to database
    const [refinement] = await db
      .insert(aiRefinements)
      .values({
        draftId,
        originalText: selectedText,
        instruction,
        refinedText: fullRefinedText,
        quickActionId: quickActionId || null,
        tokenUsage: {
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
        },
        model: MODEL,
        durationMs: duration,
        applied: false,
        createdBy: userId,
      })
      .returning();

    // Return final metadata
    return {
      refinementId: refinement.id,
      tokenUsage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      },
      model: MODEL,
      duration,
    };
  } catch (error) {
    // Handle AI SDK errors
    if (error instanceof Error) {
      throw new Error(`AI refinement error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Build custom refinement prompt for free-form instructions
 */
function buildCustomRefinementPrompt(
  selectedText: string,
  instruction: string,
  context?: RefinementContext
): string {
  const contextInfo = buildContextSection(context);

  return `You are a legal writing expert refining a section of a demand letter based on custom instructions.

${contextInfo}

# Current Section Text

${selectedText}

# Refinement Instructions

${instruction}

# Important Constraints

- Preserve ALL factual claims exactly as stated (do not add new facts)
- Do NOT change legal citations or references
- Do NOT alter proper names, dates, or specific numbers
- Maintain professional legal tone appropriate for formal correspondence
- Keep the essential message and requirements intact

Generate ONLY the refined section text. Do not include explanations or alternatives.

---

Refined section:`;
}

/**
 * Build context section for prompts
 */
function buildContextSection(context?: RefinementContext): string {
  if (!context || (!context.plaintiffName && !context.defendantName && !context.caseDescription)) {
    return '# Document Context\n\nThis is a section from a legal demand letter.';
  }

  const parts: string[] = ['# Document Context', ''];

  if (context.documentType) {
    parts.push(`**Document Type:** ${context.documentType}`);
  } else {
    parts.push('**Document Type:** Demand Letter');
  }

  if (context.plaintiffName) {
    parts.push(`**Plaintiff:** ${context.plaintiffName}`);
  }

  if (context.defendantName) {
    parts.push(`**Defendant:** ${context.defendantName}`);
  }

  if (context.caseDescription) {
    parts.push(`**Case:** ${context.caseDescription}`);
  }

  return parts.join('\n');
}

/**
 * Mark a refinement as applied
 *
 * Updates the database record to indicate the user has applied this refinement
 * to their document.
 *
 * @param refinementId - ID of the refinement to mark as applied
 */
export async function markRefinementApplied(refinementId: string): Promise<void> {
  await db
    .update(aiRefinements)
    .set({ applied: true })
    .where(eq(aiRefinements.id, refinementId));
}

/**
 * Get refinement history for a draft
 *
 * Returns all refinements requested for a draft, ordered by most recent first.
 *
 * @param draftId - ID of the draft
 * @param limit - Maximum number of refinements to return (default: 50)
 */
export async function getRefinementHistory(
  draftId: string,
  limit: number = 50
) {
  return db.query.aiRefinements.findMany({
    where: eq(aiRefinements.draftId, draftId),
    orderBy: (refinements, { desc }) => [desc(refinements.createdAt)],
    limit,
    with: {
      creator: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Verify draft exists and belongs to user's firm
 *
 * @param draftId - ID of the draft
 * @param firmId - ID of the firm (for authorization)
 * @returns Draft if found and authorized, null otherwise
 */
export async function verifyDraftAccess(draftId: string, firmId: string) {
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    with: {
      project: {
        columns: {
          firmId: true,
        },
      },
    },
  });

  if (!draft || draft.project.firmId !== firmId) {
    return null;
  }

  return draft;
}
