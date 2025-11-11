# Prompt Templates

This directory contains AI prompt templates for demand letter generation.

## Structure

```
lib/prompts/
├── README.md                          # This file
├── CHANGELOG.md                       # Version history
├── index.ts                           # Central exports
├── base-demand-letter.ts              # General-purpose prompt
├── personal-injury-demand.ts          # Personal injury cases
├── contract-dispute-demand.ts         # Contract disputes
└── __tests__/
    ├── sample-cases.ts                # Test data
    ├── prompt-quality.test.ts         # Automated tests
    └── manual-test.ts                 # Manual testing script
```

## Quick Start

```typescript
import { buildPrompt, validatePromptSize } from '@/lib/prompts';

// Build prompt (auto-detects type)
const prompt = buildPrompt(
  'personal-injury',
  sourceDocuments,
  template,
  variables
);

// Validate token count
const validation = validatePromptSize(prompt);
if (!validation.valid) {
  console.error(validation.error);
}
```

## Prompt Types

- **base**: General-purpose demand letters
- **personal-injury**: Auto accidents, slip and fall, medical malpractice
- **contract-dispute**: Breach of contract, service agreements

## Testing

```bash
# Run automated tests
npm test lib/prompts/__tests__/prompt-quality.test.ts

# Run manual inspection
npx tsx lib/prompts/__tests__/manual-test.ts

# Show full prompts
npx tsx lib/prompts/__tests__/manual-test.ts --show-full
```

## Documentation

See `/docs/prompt-engineering-guide.md` for comprehensive documentation.

## Version

Current version: 1.0.0 (2025-11-10)
