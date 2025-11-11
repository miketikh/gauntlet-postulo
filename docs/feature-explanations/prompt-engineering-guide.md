# Prompt Engineering Guide

## Overview

This guide documents the design, implementation, and usage of AI prompts for demand letter generation in the Steno application. The prompt system is designed to produce professional, factually accurate demand letters across different legal case types.

**Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Production Ready

## Architecture

### Prompt Types

The system provides three specialized prompt templates:

1. **Base Demand Letter** (`base-demand-letter.ts`)
   - General-purpose demand letter template
   - Used for cases that don't fit specialized categories
   - Examples: property damage, general negligence, miscellaneous disputes

2. **Personal Injury** (`personal-injury-demand.ts`)
   - Optimized for tort/injury cases
   - Emphasizes medical damages, pain and suffering, causation
   - Examples: auto accidents, slip and fall, medical malpractice

3. **Contract Dispute** (`contract-dispute-demand.ts`)
   - Optimized for breach of contract claims
   - Emphasizes contract terms, breach analysis, remedies
   - Examples: service agreements, purchase contracts, business disputes

### Prompt Selection

Prompts are automatically selected based on:

1. **Template metadata**: `template.promptType` field (explicit)
2. **Template name**: Keywords like "injury", "contract", "accident"
3. **Variable analysis**: Presence of injury-specific or contract-specific variables
4. **Default**: Falls back to base prompt if no indicators found

See `prompt.service.ts` → `getRecommendedPromptType()` for selection logic.

## Design Principles

### 1. Factual Accuracy Above All

**Problem:** LLMs can hallucinate facts or make unsupported claims.

**Solution:**
- Explicit instructions to cite source documents
- Required citation format: `[Source: Document Type - Author, Date]`
- Instruction to use `[To be confirmed]` for missing info rather than fabricate
- Emphasis on "only include facts explicitly supported by source documents"

**Example from prompt:**
```
Do NOT speculate or make assumptions beyond the evidence provided.
If information is missing, note it as "[To be confirmed]" rather than fabricating details.
```

### 2. Professional Legal Tone

**Problem:** Need assertive but courteous business correspondence tone.

**Solution:**
- Explicit tone guidelines in each prompt
- Examples of appropriate language style
- Prohibition on emotional or inflammatory language
- Guidance on sentence structure and clarity

**Example from prompt:**
```
- Maintain an assertive but courteous tone
- Avoid emotional or inflammatory language
- Use clear, concise sentences
```

### 3. Structured Output

**Problem:** Need consistent, predictable document structure.

**Solution:**
- Pass template section structure as JSON
- Instruction to follow section headers exactly
- Guidance on subsection creation
- Format requirements (numbered lists, paragraph length, etc.)

### 4. Case-Type Specialization

**Problem:** Different case types require different emphasis and legal elements.

**Solution:**
- Separate prompt templates for major case types
- Type-specific instructions and guidelines
- Specialized damage calculation methods
- Appropriate legal frameworks (UCC for contracts, tort law for injuries)

### 5. Token Optimization

**Problem:** Long prompts consume Claude's context window and increase costs.

**Solution:**
- Target: <4,000 input tokens per prompt
- Concise instructions without sacrificing clarity
- Inline examples rather than separate sections
- Minimal repetition
- Option to truncate source documents if needed

## Prompt Structure

All prompts follow this common structure:

```
1. System Role (Expert legal assistant)
2. Case Information (Variables substituted)
3. Source Documents (Full text)
4. Template Structure (JSON sections)
5. Type-Specific Instructions
6. General Writing Guidelines
7. Output Format Requirements
```

### Section Breakdown

#### 1. System Role
Establishes Claude's role as an expert legal assistant. Sets expectations for professionalism and accuracy.

#### 2. Case Information
Injects case-specific variables:
- Plaintiff/defendant names
- Dates (incident, contract, breach)
- Case type and description
- Demand amounts
- Jurisdiction

#### 3. Source Documents
Full text of all uploaded documents. Provides factual basis for claims.

**Optimization:** Can be truncated to fit token budget using `truncateSourceDocuments()`.

#### 4. Template Structure
JSON representation of required sections. Guides output structure.

```json
{
  "sections": [
    {"id": "1", "title": "Introduction", "required": true},
    {"id": "2", "title": "Facts of the Case", "required": true},
    ...
  ]
}
```

#### 5. Type-Specific Instructions
Varies by prompt type. Provides detailed guidance on:
- How to structure specific sections
- What to emphasize
- Damage calculation methods
- Citation requirements
- Legal elements to establish

#### 6. Writing Guidelines
Common across all prompts:
- Tone and style
- Factual accuracy requirements
- Format specifications
- Citation format

#### 7. Output Format
Explicit instructions on what to generate and what to exclude:
- Generate ONLY the letter content
- No meta-commentary
- No placeholder text
- No alternative options

## Prompt Variants

### Base Demand Letter

**Use Cases:**
- Property damage
- General negligence
- Miscellaneous disputes
- Cases that don't fit specialized categories

**Key Features:**
- Balanced structure covering liability and damages
- General legal language
- Flexible for various case types
- Standard citation requirements

**Token Budget:** ~2,500-3,500 tokens (typical)

### Personal Injury Demand

**Use Cases:**
- Auto accidents
- Slip and fall
- Medical malpractice
- Product liability

**Key Features:**
- Emphasizes medical treatment timeline
- Pain and suffering language
- Economic vs. non-economic damages breakdown
- Causation establishment
- Future medical needs
- Multiplier method for damage calculation

**Special Instructions:**
1. **Medical Damages Section:** Chronological treatment timeline with citations
2. **Pain and Suffering:** Impact on daily life with concrete examples
3. **Economic Damages:** Itemized bills and lost wages
4. **Causation:** Connect injuries to incident, distinguish pre-existing conditions
5. **Demand Calculation:** Economic damages + multiplier for pain/suffering

**Token Budget:** ~3,000-3,800 tokens (typical)

### Contract Dispute Demand

**Use Cases:**
- Breach of service agreements
- Purchase contract violations
- Business contract disputes
- Employment agreement breaches

**Key Features:**
- Verbatim contract term quotation
- Section number references
- Breach analysis framework
- UCC or applicable statute references
- Remedies analysis (damages vs. specific performance)
- Cure period and notice requirements

**Special Instructions:**
1. **Contract Terms:** Quote provisions verbatim with section numbers
2. **Breach Analysis:** Identify specific violations and materiality
3. **Damages Calculation:** Direct damages + consequential + liquidated damages
4. **Legal Basis:** Cite governing law, applicable statutes, ADR requirements
5. **Remedies:** Specify monetary damages or specific performance
6. **Notice and Cure:** Document compliance with contractual prerequisites

**Token Budget:** ~3,200-3,900 tokens (typical)

## Token Management

### Target Budget

- **Input tokens:** <4,000 per request
- **Output tokens:** ~1,500-2,500 (typical demand letter)
- **Total context:** <6,500 tokens per generation

### Optimization Techniques

1. **Concise Instructions**
   - Clear but brief language
   - Inline examples vs. separate examples sections
   - Avoid repetition

2. **Source Document Management**
   - Full documents preferred for accuracy
   - Truncation available if needed via `truncateSourceDocuments()`
   - Strategy: preserve key evidence, truncate from end

3. **Template Structure**
   - JSON format is token-efficient
   - Only include required section metadata
   - Avoid verbose descriptions

4. **Monitoring**
   - `validatePromptSize()` checks before API call
   - Logs estimated token count
   - Actual usage tracked in API response

### Token Estimation

Function: `estimateTokenCount(text: string)`

**Method:** Character count / 3.5 (conservative estimate)

**Accuracy:** ±10-15% of actual tokens

For production monitoring, consider using:
- Anthropic's tokenizer API
- `tiktoken` library
- Claude's actual token counts from response metadata

## Testing

### Automated Tests

**Location:** `lib/prompts/__tests__/prompt-quality.test.ts`

**Tests:**
- Token count validation (<4,000)
- Variable substitution verification
- Source document inclusion
- Template structure formatting
- Prompt type-specific content
- Error handling (missing variables, empty docs)

**Run tests:**
```bash
npm test lib/prompts/__tests__/prompt-quality.test.ts
```

### Manual Testing

**Script:** `lib/prompts/__tests__/manual-test.ts`

**Usage:**
```bash
# View token counts and prompt structure
npx tsx lib/prompts/__tests__/manual-test.ts

# Show full prompts
npx tsx lib/prompts/__tests__/manual-test.ts --show-full
```

**Output:**
- Token analysis per case
- Variable substitution checks
- Source document inclusion verification
- Summary statistics

### Test Cases

**Location:** `lib/prompts/__tests__/sample-cases.ts`

**Cases Included:**
1. Auto accident (personal injury)
2. Slip and fall (personal injury)
3. Service agreement breach (contract)
4. Purchase agreement breach (contract)
5. Property damage (base)

Each case includes:
- Realistic variables
- Authentic-looking source documents
- Proper template structure

### Quality Metrics

**Target Metrics:**
- ✓ All prompts <4,000 tokens
- ✓ Average <3,500 tokens
- ✓ 100% variable substitution
- ✓ Source docs fully included
- ✓ Template structure preserved
- ✓ Type-specific instructions present

## Usage Examples

### Basic Usage

```typescript
import { buildPrompt, validatePromptSize } from './services/prompt.service';

// Build prompt
const prompt = buildPrompt(
  'personal-injury',
  sourceDocuments,
  template,
  {
    plaintiffName: 'John Smith',
    defendantName: 'Jane Doe',
    incidentDate: '2024-01-15',
    injuryType: 'Whiplash and back injuries',
    // ... more variables
  }
);

// Validate
const validation = validatePromptSize(prompt);
if (!validation.valid) {
  throw new Error(validation.error);
}

// Use with Claude API
const generator = generateDemandLetter(sourceDocuments, template, variables);
for await (const chunk of generator) {
  // Handle streaming response
}
```

### Auto-Detection

```typescript
import { getRecommendedPromptType } from './services/prompt.service';

// Automatically determine prompt type
const promptType = getRecommendedPromptType(template, variables);
// Returns: 'personal-injury', 'contract-dispute', or 'base'

const prompt = buildPrompt(promptType, sourceDocuments, template, variables);
```

### With AI Service

```typescript
import { generateDemandLetter } from './services/ai.service';

// AI service automatically selects and validates prompt
const generator = generateDemandLetter(sourceDocuments, template, variables);

// Stream results
for await (const chunk of generator) {
  if (typeof chunk === 'string') {
    // Text chunk
    console.log(chunk);
  } else {
    // Metadata (final)
    console.log('Token usage:', chunk.tokenUsage);
  }
}
```

## Maintenance

### Version History

**Version 1.0 (2025-11-10)**
- Initial production release
- Three prompt types: base, personal injury, contract dispute
- Token validation and optimization
- Comprehensive test suite
- Auto-detection of prompt type

### Adding New Prompt Types

To add a new specialized prompt type:

1. **Create prompt file:** `lib/prompts/[type]-demand.ts`
   ```typescript
   export interface [Type]Variables extends PromptVariables {
     // Type-specific variables
   }

   export function build[Type]Prompt(
     sourceDocuments: string,
     templateStructure: any,
     variables: [Type]Variables
   ): string {
     return `...prompt template...`;
   }
   ```

2. **Update prompt service:** `lib/services/prompt.service.ts`
   - Add type to `PromptType` union
   - Add case to `buildPrompt()` switch
   - Add detection logic to `getRecommendedPromptType()`

3. **Create test cases:** `lib/prompts/__tests__/sample-cases.ts`
   - Add 2-3 realistic test cases
   - Include source documents
   - Add to `allTestCases` array

4. **Run tests:**
   ```bash
   npm test lib/prompts/__tests__/
   npx tsx lib/prompts/__tests__/manual-test.ts
   ```

5. **Update documentation:** Add section to this guide

### Monitoring and Optimization

**Production Monitoring:**
- Track actual token usage from Claude API
- Log prompt types used per case
- Monitor validation failures
- Review generated output quality

**Optimization Opportunities:**
- Analyze which source documents are most/least useful
- Identify common variable patterns
- Refine instructions based on output quality
- A/B test prompt variations

**Quality Assurance:**
- Periodic review of generated letters
- User feedback on output quality
- Attorney review of legal accuracy
- Compliance with jurisdiction requirements

## Troubleshooting

### Common Issues

**Issue:** Prompt exceeds 4,000 token limit

**Solutions:**
- Use `truncateSourceDocuments()` to shorten source docs
- Simplify template structure (fewer/shorter sections)
- Remove optional variables
- Consider splitting into multiple generations

---

**Issue:** Generated output doesn't follow template structure

**Solutions:**
- Verify template structure is valid JSON
- Check section titles are clear and descriptive
- Add more explicit structure instructions
- Review template for required vs. optional sections

---

**Issue:** Output includes fabricated facts

**Solutions:**
- Review source documents for completeness
- Emphasize citation requirements in prompt
- Add explicit examples of proper citations
- Consider post-processing validation

---

**Issue:** Wrong prompt type selected

**Solutions:**
- Set explicit `template.promptType` field
- Update template name to include keywords
- Add type-specific variables to case data
- Override auto-detection in `generateDemandLetter()`

---

**Issue:** Citations not formatted correctly

**Solutions:**
- Check source documents include clear document headers
- Review citation format instructions in prompt
- Provide example citations in test cases
- Post-process to standardize citation format

## Best Practices

### For Prompt Authors

1. **Be explicit:** Assume Claude needs detailed instructions
2. **Provide examples:** Show don't just tell
3. **Test thoroughly:** Use sample cases before production
4. **Monitor tokens:** Balance detail with efficiency
5. **Iterate:** Refine prompts based on actual output

### For Application Developers

1. **Validate before API call:** Always use `validatePromptSize()`
2. **Log prompt metadata:** Track types, tokens, errors
3. **Handle errors gracefully:** Token limits, API errors, validation failures
4. **Preserve source docs:** Don't truncate unless necessary
5. **Monitor costs:** Track actual token usage per case type

### For Legal Users

1. **Review all output:** AI-generated content requires attorney review
2. **Verify facts:** Check all citations against source documents
3. **Customize as needed:** Use generated letter as starting point
4. **Provide feedback:** Help improve prompts over time
5. **Understand limitations:** AI assists but doesn't replace legal expertise

## Future Enhancements

### Planned Features

1. **Additional prompt types:**
   - Employment law
   - Intellectual property
   - Real estate disputes
   - Insurance claims

2. **Jurisdiction-specific variants:**
   - State-specific legal language
   - Jurisdiction-specific statutes
   - Local court rules

3. **Dynamic prompts:**
   - Adjust based on source document length
   - Customize based on user preferences
   - Adapt to template complexity

4. **Quality scoring:**
   - Automated citation validation
   - Fact-checking against source docs
   - Tone analysis
   - Completeness metrics

5. **Multilingual support:**
   - Spanish demand letters
   - Other languages as needed

### Research Areas

- Prompt chaining for complex cases
- Few-shot learning with firm-specific examples
- Fine-tuning on legal corpus
- Retrieval-augmented generation (RAG)
- Multi-model ensembling

## References

- [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Claude 3.5 Sonnet Documentation](https://docs.anthropic.com/claude/docs/models-overview)
- Project Architecture: `docs/architecture.md`
- AI Service: `lib/services/ai.service.ts`
- Prompt Service: `lib/services/prompt.service.ts`

## Support

For questions or issues:
- Review this guide and test cases
- Check prompt source code and comments
- Run manual tests to inspect prompts
- Consult team for prompt design decisions

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Maintained By:** Development Team
