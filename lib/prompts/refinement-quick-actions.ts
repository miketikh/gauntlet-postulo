/**
 * Refinement Quick Actions Prompt Templates
 * Version: 1.0
 * Last Updated: 2025-11-11
 *
 * Purpose:
 * Provides optimized prompt templates for the 6 quick action refinement buttons.
 * Each template is specifically engineered for legal demand letter refinement,
 * emphasizing context preservation and maintaining factual accuracy.
 *
 * Design Rationale:
 * - Templates include demand letter context awareness
 * - Instructions preserve case facts and legal tone
 * - Each template optimized for specific transformation type
 * - Prompts prevent AI from adding unsupported facts
 * - Maintains consistency with original document structure
 */

/**
 * Quick Action IDs (must match UI component)
 */
export type QuickActionId =
  | 'make-assertive'
  | 'add-detail'
  | 'shorten'
  | 'emphasize-liability'
  | 'soften-tone'
  | 'improve-clarity';

/**
 * Context information for refinement
 */
export interface RefinementContext {
  /** The plaintiff's name */
  plaintiffName?: string;
  /** The defendant's name */
  defendantName?: string;
  /** Brief case description */
  caseDescription?: string;
  /** Document type (demand letter, settlement proposal, etc.) */
  documentType?: string;
}

/**
 * Quick action metadata
 */
export interface QuickActionMetadata {
  id: QuickActionId;
  name: string;
  description: string;
  instruction: string;
}

/**
 * All quick actions with their metadata
 */
export const QUICK_ACTIONS: QuickActionMetadata[] = [
  {
    id: 'make-assertive',
    name: 'Make More Assertive',
    description: 'Strengthen language and emphasize demands',
    instruction: 'Make this section more assertive and emphatic while maintaining professionalism',
  },
  {
    id: 'add-detail',
    name: 'Add More Detail',
    description: 'Expand content with additional context',
    instruction: 'Expand this section with more detail and context',
  },
  {
    id: 'shorten',
    name: 'Shorten This Section',
    description: 'Condense while preserving key points',
    instruction: 'Condense this section while preserving all key points',
  },
  {
    id: 'emphasize-liability',
    name: 'Emphasize Liability',
    description: "Highlight defendant's responsibility",
    instruction: "Emphasize the defendant's liability and legal responsibility",
  },
  {
    id: 'soften-tone',
    name: 'Soften Tone',
    description: 'Make language more conciliatory',
    instruction: 'Soften the tone to be more conciliatory while maintaining the core message',
  },
  {
    id: 'improve-clarity',
    name: 'Improve Clarity',
    description: 'Simplify complex language',
    instruction: 'Simplify and clarify the language for better readability',
  },
];

/**
 * Build refinement prompt for "Make More Assertive" quick action
 */
function buildAssertivePrompt(
  selectedText: string,
  context: RefinementContext
): string {
  const contextInfo = buildContextSection(context);

  return `You are a legal writing expert refining a section of a demand letter to make it more assertive and emphatic.

${contextInfo}

# Current Section Text

${selectedText}

# Refinement Instructions

Transform this section to be more assertive and emphatic while:
- Using stronger, more definitive language ("will" instead of "may", "must" instead of "should")
- Emphasizing the defendant's obligations and responsibilities
- Strengthening the demands and consequences of non-compliance
- Maintaining professional legal tone (avoid inflammatory or emotional language)
- Preserving ALL factual claims exactly as stated (do not add new facts)
- Keeping the same general structure and length

# Important Constraints

- Do NOT add facts, dates, amounts, or claims not present in the original
- Do NOT change legal citations or references
- Do NOT alter proper names, dates, or specific numbers
- ONLY modify tone, word choice, and sentence structure

Generate ONLY the refined section text. Do not include explanations or alternatives.

---

Refined section:`;
}

/**
 * Build refinement prompt for "Add More Detail" quick action
 */
function buildDetailPrompt(
  selectedText: string,
  context: RefinementContext
): string {
  const contextInfo = buildContextSection(context);

  return `You are a legal writing expert refining a section of a demand letter to add more detail and context.

${contextInfo}

# Current Section Text

${selectedText}

# Refinement Instructions

Expand this section with additional detail and context while:
- Elaborating on existing points with more explanation
- Adding relevant legal context or implications
- Providing more specific language about consequences or requirements
- Using examples or elaboration to strengthen existing claims
- Maintaining the professional legal tone
- Preserving ALL original factual claims exactly as stated

# Important Constraints

- Do NOT invent new facts, events, amounts, or dates not implied by the original
- Do NOT add medical details, injuries, or damages beyond what's stated
- Do NOT introduce new legal theories or claims
- ONLY expand on points already present in the original text
- Keep expansion reasonable (aim for 1.5-2x original length, not more)

Generate ONLY the refined section text. Do not include explanations or alternatives.

---

Refined section:`;
}

/**
 * Build refinement prompt for "Shorten This Section" quick action
 */
function buildShortenPrompt(
  selectedText: string,
  context: RefinementContext
): string {
  const contextInfo = buildContextSection(context);

  return `You are a legal writing expert refining a section of a demand letter to make it more concise.

${contextInfo}

# Current Section Text

${selectedText}

# Refinement Instructions

Condense this section to be more concise while:
- Preserving ALL key facts, claims, and demands
- Removing redundant phrases or repetitive language
- Combining related points efficiently
- Using more direct, economical phrasing
- Maintaining the professional legal tone
- Keeping the essential message intact

# Important Constraints

- Do NOT remove any factual claims, dates, amounts, or important details
- Do NOT eliminate legal citations or references
- Do NOT alter the fundamental meaning or demands
- ONLY remove unnecessary verbosity and redundancy
- Aim for 50-70% of original length while preserving core content

Generate ONLY the refined section text. Do not include explanations or alternatives.

---

Refined section:`;
}

/**
 * Build refinement prompt for "Emphasize Liability" quick action
 */
function buildLiabilityPrompt(
  selectedText: string,
  context: RefinementContext
): string {
  const contextInfo = buildContextSection(context);

  return `You are a legal writing expert refining a section of a demand letter to emphasize the defendant's liability.

${contextInfo}

# Current Section Text

${selectedText}

# Refinement Instructions

Rewrite this section to emphasize the defendant's liability and legal responsibility while:
- Highlighting the defendant's duty of care or contractual obligations
- Emphasizing how the defendant's actions or inactions caused harm
- Using clear causal language connecting defendant's conduct to damages
- Strengthening attribution of fault and responsibility
- Maintaining professional, evidence-based legal tone
- Preserving ALL factual claims exactly as stated

# Important Constraints

- Do NOT add new facts about the defendant's conduct not present in original
- Do NOT make unsupported legal conclusions
- Do NOT introduce new theories of liability
- ONLY reframe and emphasize existing liability claims
- Maintain factual accuracy and avoid speculation

Generate ONLY the refined section text. Do not include explanations or alternatives.

---

Refined section:`;
}

/**
 * Build refinement prompt for "Soften Tone" quick action
 */
function buildSoftenPrompt(
  selectedText: string,
  context: RefinementContext
): string {
  const contextInfo = buildContextSection(context);

  return `You are a legal writing expert refining a section of a demand letter to adopt a more conciliatory tone.

${contextInfo}

# Current Section Text

${selectedText}

# Refinement Instructions

Rewrite this section with a softer, more conciliatory tone while:
- Using more collaborative language ("we request" instead of "we demand")
- Emphasizing resolution and settlement rather than confrontation
- Framing consequences as unfortunate necessities rather than threats
- Maintaining professionalism and firmness on core demands
- Preserving ALL factual claims and demands exactly as stated
- Keeping the essential message and requirements intact

# Important Constraints

- Do NOT weaken the actual demands or required remedies
- Do NOT remove deadlines or consequences entirely
- Do NOT compromise on factual claims or liability assertions
- ONLY modify tone and phrasing, not substance
- Maintain credibility and seriousness of the letter

Generate ONLY the refined section text. Do not include explanations or alternatives.

---

Refined section:`;
}

/**
 * Build refinement prompt for "Improve Clarity" quick action
 */
function buildClarityPrompt(
  selectedText: string,
  context: RefinementContext
): string {
  const contextInfo = buildContextSection(context);

  return `You are a legal writing expert refining a section of a demand letter to improve clarity and readability.

${contextInfo}

# Current Section Text

${selectedText}

# Refinement Instructions

Rewrite this section to improve clarity and readability while:
- Simplifying complex or convoluted sentences
- Using plain language where possible (while maintaining legal precision)
- Breaking up run-on sentences into clearer statements
- Organizing information in logical order
- Eliminating jargon where simpler terms suffice
- Preserving ALL factual claims and legal precision exactly as stated

# Important Constraints

- Do NOT remove necessary legal terminology or precision
- Do NOT oversimplify to the point of losing legal accuracy
- Do NOT change the meaning or substance of claims
- ONLY improve sentence structure, word choice, and organization
- Maintain professional legal tone appropriate for formal correspondence

Generate ONLY the refined section text. Do not include explanations or alternatives.

---

Refined section:`;
}

/**
 * Build context section for prompts
 */
function buildContextSection(context: RefinementContext): string {
  if (!context.plaintiffName && !context.defendantName && !context.caseDescription) {
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
 * Build refinement prompt based on quick action ID
 *
 * @param quickActionId - The ID of the quick action selected
 * @param selectedText - The text selected for refinement
 * @param context - Optional case context information
 * @returns Complete prompt for AI refinement
 *
 * @example
 * ```typescript
 * const prompt = buildRefinementPrompt(
 *   'make-assertive',
 *   'The defendant failed to maintain the property.',
 *   { plaintiffName: 'John Doe', defendantName: 'ACME Corp' }
 * );
 * ```
 */
export function buildRefinementPrompt(
  quickActionId: QuickActionId,
  selectedText: string,
  context: RefinementContext = {}
): string {
  switch (quickActionId) {
    case 'make-assertive':
      return buildAssertivePrompt(selectedText, context);

    case 'add-detail':
      return buildDetailPrompt(selectedText, context);

    case 'shorten':
      return buildShortenPrompt(selectedText, context);

    case 'emphasize-liability':
      return buildLiabilityPrompt(selectedText, context);

    case 'soften-tone':
      return buildSoftenPrompt(selectedText, context);

    case 'improve-clarity':
      return buildClarityPrompt(selectedText, context);

    default:
      throw new Error(`Unknown quick action ID: ${quickActionId}`);
  }
}

/**
 * Get quick action metadata by ID
 */
export function getQuickActionMetadata(quickActionId: QuickActionId): QuickActionMetadata | undefined {
  return QUICK_ACTIONS.find(action => action.id === quickActionId);
}

/**
 * Validate quick action ID
 */
export function isValidQuickActionId(id: string): id is QuickActionId {
  return QUICK_ACTIONS.some(action => action.id === id);
}
