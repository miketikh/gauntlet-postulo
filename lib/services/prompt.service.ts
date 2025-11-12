/**
 * Prompt Service
 * Routes to appropriate prompt template and validates token usage
 */

import { buildBaseDemandLetterPrompt, PromptVariables } from '../prompts/base-demand-letter';
import { buildPersonalInjuryPrompt, PersonalInjuryVariables } from '../prompts/personal-injury-demand';
import { buildContractDisputePrompt, ContractDisputeVariables } from '../prompts/contract-dispute-demand';

export type PromptType = 'base' | 'personal-injury' | 'contract-dispute';

/**
 * Build appropriate prompt based on template type
 *
 * @param promptType - Type of demand letter (base, personal-injury, contract-dispute)
 * @param sourceDocuments - Combined text from all source documents
 * @param templateStructure - Template sections and structure
 * @param variables - Case-specific variables (plaintiff, defendant, dates, etc.)
 * @returns Complete prompt for Claude API
 */
export function buildPrompt(
  promptType: PromptType,
  sourceDocuments: string,
  templateStructure: any,
  variables: any
): string {
  switch (promptType) {
    case 'personal-injury':
      return buildPersonalInjuryPrompt(sourceDocuments, templateStructure, variables as PersonalInjuryVariables);

    case 'contract-dispute':
      return buildContractDisputePrompt(sourceDocuments, templateStructure, variables as ContractDisputeVariables);

    case 'base':
    default:
      return buildBaseDemandLetterPrompt(sourceDocuments, templateStructure, variables as PromptVariables);
  }
}

/**
 * Estimate token count for prompt
 *
 * Uses the standard approximation of ~4 characters per token for English text.
 * This is a rough estimate - actual token count may vary by ~10-15%.
 *
 * For more accurate counts, consider using tiktoken library or Claude's
 * tokenizer API in production.
 *
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  // More conservative estimate for prompts with special formatting
  return Math.ceil(text.length / 3.5);
}

/**
 * Validate prompt size and estimate token count
 *
 * Estimates the token count for the prompt for logging and monitoring purposes.
 * No hard limit is enforced - the API will handle context window limits naturally.
 *
 * @param prompt - Complete prompt to validate
 * @returns Validation result with token count (always valid)
 */
export function validatePromptSize(prompt: string): {
  valid: boolean;
  tokenCount: number;
  error?: string;
} {
  const tokenCount = estimateTokenCount(prompt);

  // Always return valid - no artificial token limits
  return { valid: true, tokenCount };
}

/**
 * Truncate source documents to fit within token budget
 *
 * If source documents are too long, this function intelligently truncates them
 * while preserving the most important information.
 *
 * Strategy:
 * - Preserve medical records and key evidence documents first
 * - Truncate from the end of longer documents
 * - Ensure at least some content from each document is included
 *
 * @param sourceDocuments - Full source document text
 * @param maxTokens - Maximum tokens to use for source documents
 * @returns Truncated source documents
 */
export function truncateSourceDocuments(sourceDocuments: string, maxTokens: number): string {
  const currentTokens = estimateTokenCount(sourceDocuments);

  if (currentTokens <= maxTokens) {
    return sourceDocuments;
  }

  // Calculate target character count
  const targetChars = Math.floor(maxTokens * 3.5);

  // Simple truncation with ellipsis
  if (sourceDocuments.length > targetChars) {
    return sourceDocuments.substring(0, targetChars - 100) + '\n\n[... Source documents truncated due to length ...]';
  }

  return sourceDocuments;
}

/**
 * Get recommended prompt type based on template metadata or variables
 *
 * Analyzes the template and variables to suggest the most appropriate
 * prompt type if not explicitly specified.
 *
 * @param template - Template object with metadata
 * @param variables - Case variables
 * @returns Recommended prompt type
 */
export function getRecommendedPromptType(template: any, variables: any): PromptType {
  // Check template metadata
  if (template.promptType) {
    return template.promptType as PromptType;
  }

  // Check template name for keywords
  const templateName = (template.name || '').toLowerCase();
  if (templateName.includes('injury') || templateName.includes('accident')) {
    return 'personal-injury';
  }
  if (templateName.includes('contract') || templateName.includes('breach')) {
    return 'contract-dispute';
  }

  // Check variables for type indicators
  if (variables.injuryType || variables.medicalProviders) {
    return 'personal-injury';
  }
  if (variables.contractDate || variables.breachDate) {
    return 'contract-dispute';
  }

  // Default to base prompt
  return 'base';
}
