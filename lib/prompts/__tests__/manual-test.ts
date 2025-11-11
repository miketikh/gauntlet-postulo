/**
 * Manual Test Script for Prompt Quality
 *
 * Run this script to see actual prompts generated and their token counts.
 * This helps validate prompt quality before running full Claude API tests.
 *
 * Usage:
 *   npx tsx lib/prompts/__tests__/manual-test.ts
 *
 * To test with Claude API (requires ANTHROPIC_API_KEY):
 *   npx tsx lib/prompts/__tests__/manual-test.ts --with-api
 */

import { buildPrompt, validatePromptSize, estimateTokenCount } from '../../services/prompt.service';
import { allTestCases } from './sample-cases';

const WITH_API = process.argv.includes('--with-api');

console.log('='.repeat(80));
console.log('PROMPT QUALITY MANUAL TEST');
console.log('='.repeat(80));
console.log();

// Test each case
for (const testCase of allTestCases) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST CASE: ${testCase.name}`);
  console.log(`Prompt Type: ${testCase.promptType}`);
  console.log(`${'='.repeat(80)}\n`);

  // Build prompt
  const prompt = buildPrompt(
    testCase.promptType,
    testCase.sourceDocuments,
    testCase.template,
    testCase.variables
  );

  // Validate token count
  const validation = validatePromptSize(prompt);

  console.log('TOKEN ANALYSIS:');
  console.log(`  Estimated tokens: ${validation.tokenCount}`);
  console.log(`  Under limit (4000): ${validation.valid ? '✓ Yes' : '✗ No'}`);
  console.log(`  Characters: ${prompt.length}`);
  console.log(`  Lines: ${prompt.split('\n').length}`);

  if (!validation.valid) {
    console.log(`  ERROR: ${validation.error}`);
  }

  // Show prompt structure
  console.log('\nPROMPT STRUCTURE:');
  const lines = prompt.split('\n');
  console.log(`  First 10 lines:`);
  lines.slice(0, 10).forEach((line, i) => {
    console.log(`    ${i + 1}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  });

  console.log(`\n  Section headers found:`);
  const headers = lines.filter(line => line.startsWith('#') || line.startsWith('**'));
  headers.slice(0, 10).forEach(header => {
    console.log(`    - ${header.substring(0, 80)}`);
  });

  // Check variable substitution
  console.log('\nVARIABLE SUBSTITUTION CHECK:');
  const checkVariable = (name: string, value: any) => {
    if (value && typeof value === 'string') {
      const found = prompt.includes(value);
      console.log(`  ${name}: ${found ? '✓' : '✗'} ${found ? 'Found' : 'Missing'}`);
    }
  };

  checkVariable('plaintiffName', testCase.variables.plaintiffName);
  checkVariable('defendantName', testCase.variables.defendantName);
  checkVariable('incidentDate', testCase.variables.incidentDate);

  // Check source document inclusion
  console.log('\nSOURCE DOCUMENT CHECK:');
  const firstDocLine = testCase.sourceDocuments.split('\n')[0];
  const docIncluded = prompt.includes(firstDocLine);
  console.log(`  Documents included: ${docIncluded ? '✓ Yes' : '✗ No'}`);

  // Option to show full prompt
  if (process.argv.includes('--show-full')) {
    console.log('\n--- FULL PROMPT ---');
    console.log(prompt);
    console.log('--- END PROMPT ---\n');
  }
}

// Summary statistics
console.log(`\n${'='.repeat(80)}`);
console.log('SUMMARY STATISTICS');
console.log(`${'='.repeat(80)}\n`);

const tokenCounts = allTestCases.map(testCase => {
  const prompt = buildPrompt(
    testCase.promptType,
    testCase.sourceDocuments,
    testCase.template,
    testCase.variables
  );
  return estimateTokenCount(prompt);
});

console.log(`Total test cases: ${allTestCases.length}`);
console.log(`Token counts:`);
console.log(`  Minimum: ${Math.min(...tokenCounts)} tokens`);
console.log(`  Maximum: ${Math.max(...tokenCounts)} tokens`);
console.log(`  Average: ${(tokenCounts.reduce((a, b) => a + b) / tokenCounts.length).toFixed(0)} tokens`);
console.log(`  Target: <4000 tokens`);

const allValid = tokenCounts.every(count => count < 4000);
console.log(`\nAll prompts under limit: ${allValid ? '✓ PASS' : '✗ FAIL'}`);

// Test with Claude API if requested
if (WITH_API) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('CLAUDE API TEST (First case only)');
  console.log(`${'='.repeat(80)}\n`);

  // This would require importing and using the AI service
  console.log('Note: Actual Claude API testing should be done through the full application');
  console.log('This would test:');
  console.log('  - API connectivity');
  console.log('  - Actual token usage (input + output)');
  console.log('  - Response quality');
  console.log('  - Generation time');
  console.log('  - Error handling');
  console.log('\nTo test with Claude API, use the application test suite or integration tests.');
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));

// Exit with success if all valid, error otherwise
process.exit(allValid ? 0 : 1);
