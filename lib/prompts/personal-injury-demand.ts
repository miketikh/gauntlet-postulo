/**
 * Personal Injury Demand Letter Prompt
 * Version: 1.0
 *
 * Specialized for personal injury cases involving:
 * - Auto accidents
 * - Slip and fall
 * - Medical malpractice
 * - Product liability
 *
 * Key Differences from Base:
 * - Emphasizes medical damages and treatment timeline
 * - Includes pain and suffering language
 * - Highlights long-term impacts and future medical needs
 * - Establishes causation more thoroughly
 * - Uses multiplier method for non-economic damages
 */

import { PromptVariables } from './base-demand-letter';

export interface PersonalInjuryVariables extends PromptVariables {
  injuryType: string;
  medicalProviders: string[];
  totalMedicalExpenses?: string;
  lostWages?: string;
  permanentImpairment?: string;
}

/**
 * Build personal injury demand letter prompt
 *
 * This specialized prompt produces demand letters optimized for
 * personal injury cases with emphasis on medical damages and causation.
 */
export function buildPersonalInjuryPrompt(
  sourceDocuments: string,
  templateStructure: any,
  variables: PersonalInjuryVariables
): string {
  return `You are an expert personal injury attorney drafting a demand letter for damages resulting from ${variables.injuryType}.

# Case Summary

**Injured Party:** ${variables.plaintiffName}
**Defendant:** ${variables.defendantName}
**Date of Incident:** ${variables.incidentDate}
**Type of Injury:** ${variables.injuryType}
${variables.totalMedicalExpenses ? `**Medical Expenses to Date:** ${variables.totalMedicalExpenses}` : ''}
${variables.lostWages ? `**Lost Wages:** ${variables.lostWages}` : ''}
${variables.permanentImpairment ? `**Permanent Impairment:** ${variables.permanentImpairment}` : ''}
${variables.demandAmount ? `**Total Demand:** ${variables.demandAmount}` : ''}

# Medical Documentation

The source documents include medical records, bills, and treatment notes from:
${variables.medicalProviders?.map(p => `- ${p}`).join('\n') || '- [Medical providers listed in source documents]'}

# Source Documents

${sourceDocuments}

# Template Structure

${JSON.stringify(templateStructure.sections, null, 2)}

# Special Instructions for Personal Injury Cases

1. **Medical Damages Section:**
   - Chronologically detail the treatment timeline starting from the incident
   - Cite specific medical records for each treatment phase with dates and providers
   - Include both past medical expenses and anticipated future medical costs
   - Highlight any permanent injuries, disabilities, or scarring
   - Reference diagnostic tests, procedures, and specialist consultations
   - Example: "Following the accident, Mr. Smith was transported to County Hospital ER where he was diagnosed with cervical strain and lumbar contusion [Source: ER Report - Dr. Johnson, 01/15/2024]."

2. **Pain and Suffering:**
   - Describe the physical pain endured during acute phase and ongoing treatment
   - Detail specific impacts on daily activities (sleep, work, recreation, family life)
   - Include emotional distress, anxiety, depression, and loss of enjoyment of life
   - Reference medical notes documenting pain levels, limitations, and psychological impact
   - Use concrete examples: "Unable to lift his children, drive for more than 20 minutes, or return to his hobby of hiking"

3. **Economic Damages:**
   - Itemize all medical bills with specific amounts and providers
   - Calculate lost wages with supporting documentation (pay stubs, employer letters)
   - Include lost earning capacity if permanently disabled or restricted
   - Account for property damage if applicable to the incident
   - Break down amounts clearly: Emergency care ($X), Follow-up visits ($Y), Physical therapy ($Z)

4. **Causation:**
   - Clearly establish that the defendant's negligence directly caused the injuries
   - Connect each medical expense and treatment directly to the incident
   - Distinguish any pre-existing conditions from incident-related injuries
   - Use medical expert opinions and records to establish causation
   - Example: "Prior to the incident, Mr. Smith had no history of back problems. The herniated disc at L4-L5 was directly caused by the rear-end collision [Source: MRI Report - Dr. Lee, 02/01/2024]."

5. **Demand Calculation:**
   - Break down economic damages (medical expenses + lost wages) with totals
   - Justify non-economic damages (pain and suffering) with specific examples
   - Apply appropriate multiplier based on injury severity (typically 1.5x to 5x economic damages)
   - Include pre-judgment interest where applicable
   - Account for future medical expenses and ongoing treatment needs

6. **Liability Establishment:**
   - Clearly state the defendant's duty of care
   - Describe how the defendant breached that duty
   - Establish proximate cause between breach and injuries
   - Cite police reports, witness statements, or expert opinions supporting liability

# Writing Guidelines

**Tone:** Professional and assertive while remaining courteous. Emphasize the serious impact on the client's life without being inflammatory.

**Factual Accuracy:** Every claim about injuries, treatment, and damages must be supported by source documents. Cite specific records with dates.

**Format:** Use section headers from the template. Create clear subsections for medical treatment timeline, economic damages breakdown, and non-economic damages description.

**Citations:** Use format: "[Source: Document Type - Provider/Author, Date]"

# Output Format

Generate ONLY the complete demand letter content. Do not include meta-commentary, explanations, or placeholder text. Begin with the date and recipient information, then proceed directly with the letter content following the template structure.

---

Generate the personal injury demand letter now:`;
}
