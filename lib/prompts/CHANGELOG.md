# Prompt Templates Changelog

All notable changes to the prompt templates will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-10

### Added
- **Base Demand Letter Prompt** (`base-demand-letter.ts`)
  - General-purpose demand letter template
  - Comprehensive writing guidelines
  - Citation format requirements
  - Professional tone instructions
  - Target: <4000 tokens

- **Personal Injury Prompt** (`personal-injury-demand.ts`)
  - Specialized for tort/injury cases
  - Medical damages emphasis
  - Pain and suffering language
  - Treatment timeline structure
  - Causation establishment guidelines
  - Damage multiplier methodology
  - Target: <4000 tokens

- **Contract Dispute Prompt** (`contract-dispute-demand.ts`)
  - Specialized for breach of contract claims
  - Verbatim contract term quoting
  - Breach analysis framework
  - UCC and statute references
  - Remedy selection guidance (damages vs. specific performance)
  - Notice and cure requirements
  - Target: <4000 tokens

- **Prompt Service** (`../services/prompt.service.ts`)
  - Automatic prompt type detection
  - Token counting and validation
  - Source document truncation utilities
  - Prompt routing logic

- **Test Suite**
  - 5 comprehensive test cases with realistic source documents
  - 20 automated quality tests
  - Manual testing script with detailed output
  - Token usage validation

- **Documentation**
  - Comprehensive prompt engineering guide
  - Design rationale and best practices
  - Usage examples
  - Troubleshooting guide

### Token Usage Statistics (Initial Release)
- Minimum: 1,233 tokens (Base - Property Damage)
- Maximum: 2,365 tokens (Contract - Service Agreement)
- Average: 1,974 tokens
- All prompts: UNDER 4,000 token target ✓

### Test Results
- 20/20 tests passing
- 100% variable substitution
- 100% source document inclusion
- All prompts validated under token limit

---

## Future Versions

### [1.1.0] - Planned
- Employment law prompt variant
- Real estate dispute prompt variant
- Enhanced citation validation
- Jurisdiction-specific customization

### [1.2.0] - Planned
- Intellectual property prompt variant
- Insurance claim prompt variant
- Multilingual support (Spanish)
- Dynamic prompt adjustment based on document length

### [2.0.0] - Research
- Prompt chaining for complex cases
- Few-shot learning with firm examples
- RAG integration for case law
- Quality scoring and validation

---

## Version History Notes

**Version Format:** MAJOR.MINOR.PATCH
- **MAJOR**: Breaking changes to prompt structure or output format
- **MINOR**: New prompt types or significant enhancements
- **PATCH**: Bug fixes, token optimizations, clarifications

**Change Tracking:**
- All prompt changes must update this changelog
- Include token impact analysis
- Document reasoning for significant changes
- Update test cases as needed

**Approval Process:**
- Minor/Major changes require team review
- Test with sample cases before deployment
- Update documentation accordingly
- Validate token usage remains under limits
