/**
 * Prompt Templates Index
 *
 * Central export point for all prompt templates and types.
 * Use this file to import prompt functionality throughout the application.
 */

// Base prompt
export { buildBaseDemandLetterPrompt, type PromptVariables } from './base-demand-letter';

// Personal injury prompt
export {
  buildPersonalInjuryPrompt,
  type PersonalInjuryVariables
} from './personal-injury-demand';

// Contract dispute prompt
export {
  buildContractDisputePrompt,
  type ContractDisputeVariables
} from './contract-dispute-demand';

// Re-export prompt service for convenience
export {
  buildPrompt,
  validatePromptSize,
  estimateTokenCount,
  truncateSourceDocuments,
  getRecommendedPromptType,
  type PromptType,
} from '../services/prompt.service';
