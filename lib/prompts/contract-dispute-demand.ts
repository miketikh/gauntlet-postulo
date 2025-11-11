/**
 * Contract Dispute Demand Letter Prompt
 * Version: 1.0
 *
 * Specialized for breach of contract cases:
 * - Business contracts
 * - Service agreements
 * - Vendor/supplier disputes
 * - Employment agreements
 * - Purchase agreements
 *
 * Key Differences from Base:
 * - Emphasizes contract terms and specific provisions breached
 * - Focuses on legal interpretation and performance obligations
 * - Highlights remedies available under contract and law
 * - Addresses cure periods and notice requirements
 * - References UCC or other applicable statutory frameworks
 */

import { PromptVariables } from './base-demand-letter';

export interface ContractDisputeVariables extends PromptVariables {
  contractDate: string;
  contractType: string;
  breachDate: string;
  breachDescription: string;
  contractualDamages?: string;
  specificPerformanceRequested?: boolean;
  governingLaw?: string;
}

/**
 * Build contract dispute demand letter prompt
 *
 * This specialized prompt produces demand letters optimized for
 * breach of contract claims with emphasis on contract terms and legal remedies.
 */
export function buildContractDisputePrompt(
  sourceDocuments: string,
  templateStructure: any,
  variables: ContractDisputeVariables
): string {
  return `You are an expert contract attorney drafting a demand letter for breach of contract.

# Contract Information

**Contract Type:** ${variables.contractType}
**Contract Date:** ${variables.contractDate}
**Parties:**
- Client (Non-Breaching Party): ${variables.plaintiffName}
- Defendant (Breaching Party): ${variables.defendantName}

**Breach Information:**
- Date of Breach: ${variables.breachDate}
- Nature of Breach: ${variables.breachDescription}
${variables.contractualDamages ? `- Claimed Damages: ${variables.contractualDamages}` : ''}
${variables.specificPerformanceRequested ? '- Remedy Sought: Specific Performance' : '- Remedy Sought: Damages'}
${variables.governingLaw ? `- Governing Law: ${variables.governingLaw}` : ''}

# Source Documents

The following documents support this claim:

${sourceDocuments}

# Template Structure

${JSON.stringify(templateStructure.sections, null, 2)}

# Special Instructions for Contract Disputes

1. **Contract Terms Section:**
   - Quote relevant contract provisions verbatim from the source documents
   - Include specific section numbers, article references, and page numbers
   - Highlight the particular obligations that were breached
   - Reference any notice requirements, cure periods, or procedural provisions
   - Example: "Section 3.2 of the Service Agreement states: 'Vendor shall deliver all equipment within 30 days of purchase order date.' [Source: Service Agreement, Page 3, executed 06/01/2023]"

2. **Breach Analysis:**
   - Identify the specific contract provision(s) violated with precision
   - Describe in detail how the defendant failed to perform their obligations
   - Establish the materiality of the breach (significant vs. minor)
   - Document the timeline of non-performance with specific dates
   - Note any communications attempting to resolve the breach informally
   - Example: "Despite receiving the purchase order on 06/15/2024, Defendant failed to deliver any equipment by the required 07/15/2024 deadline, constituting a material breach."

3. **Damages Calculation:**
   - Calculate direct damages (actual losses incurred due to breach)
   - Include cost of cover (expense of obtaining substitute performance)
   - Account for lost profits if reasonably foreseeable and calculable
   - Apply any liquidated damages clauses specified in the contract
   - Subtract any mitigation efforts undertaken by the non-breaching party
   - Include incidental damages (costs incurred in responding to breach)
   - Example breakdown: "Direct damages: $50,000 (contract price), Cost of cover: $15,000 (premium paid for substitute vendor), Lost profits: $10,000 (documented in business records)"

4. **Legal Basis:**
   - Cite the contract's governing law clause and apply that jurisdiction's contract law
   - Reference applicable statutes (UCC Article 2 for sale of goods, etc.)
   - Note any alternative dispute resolution requirements (mediation, arbitration)
   - Highlight attorney's fees provisions if the contract allows recovery
   - Reference industry standards or custom if relevant to interpretation
   - Cite any relevant case law only if provided in source documents

5. **Remedies Sought:**
   - Specify whether seeking monetary damages or specific performance
   - If specific performance: explain why monetary damages are inadequate
   - Include demand for pre-judgment interest where applicable
   - Request reimbursement of costs and attorney's fees if contractually available
   - Set a reasonable deadline for cure or payment (typically 10-30 days)
   - Outline next steps if demand is not met (litigation, arbitration, etc.)

6. **Notice and Cure:**
   - Reference any contractual notice requirements and confirm compliance
   - Note whether a cure period was provided and whether it has expired
   - Document any communications during the cure period
   - Establish that all contractual prerequisites to legal action have been satisfied

7. **Performance History:**
   - Note any pattern of prior breaches or performance issues
   - Highlight the client's full performance of their own obligations
   - Reference any amendments, modifications, or waivers to original terms
   - Address any defenses the defendant might raise (impossibility, frustration of purpose, etc.)

# Writing Guidelines

**Tone:** Formal and businesslike. Emphasize the clear breach of contract terms without emotional language. Be precise and legalistic when discussing contract provisions.

**Factual Accuracy:** Every statement about contract terms, dates, and performance must be supported by source documents. Quote contract language exactly.

**Format:** Use section headers from the template. Create clear subsections for contract terms, breach analysis, and damages calculation. Use numbered paragraphs if discussing multiple breached provisions.

**Citations:** Use format: "[Source: Contract Section X.X, Page Y, Date]" or "[Source: Email from Defendant, Date]"

# Output Format

Generate ONLY the complete demand letter content. Do not include meta-commentary, explanations, or placeholder text. Begin with the date and recipient information, then proceed directly with the letter content following the template structure.

---

Generate the contract dispute demand letter now:`;
}
