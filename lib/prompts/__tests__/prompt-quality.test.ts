/**
 * Prompt Quality Tests
 *
 * Tests prompt templates for:
 * 1. Token count validation (under 4,000 tokens)
 * 2. Proper variable substitution
 * 3. Source document inclusion
 * 4. Template structure formatting
 *
 * These tests validate prompt construction but do NOT call the Claude API.
 * For actual output quality testing, run manual tests with sample cases.
 */

import { describe, it, expect } from 'vitest';
import { buildPrompt, validatePromptSize, estimateTokenCount } from '../../services/prompt.service';
import { allTestCases, TestCase } from './sample-cases';

describe('Prompt Quality Tests', () => {
  describe('Token Count Validation', () => {
    it.each(allTestCases.map(tc => [tc.name, tc]))(
      'should generate prompt under 4,000 tokens for: %s',
      (name: string, testCase: TestCase) => {
        const prompt = buildPrompt(
          testCase.promptType,
          testCase.sourceDocuments,
          testCase.template,
          testCase.variables
        );

        const validation = validatePromptSize(prompt);

        expect(validation.valid).toBe(true);
        expect(validation.tokenCount).toBeLessThan(4000);

        console.log(`  ${name}: ${validation.tokenCount} tokens`);
      }
    );
  });

  describe('Variable Substitution', () => {
    it('should include plaintiff name in prompt', () => {
      const testCase = allTestCases[0];
      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      expect(prompt).toContain(testCase.variables.plaintiffName);
    });

    it('should include defendant name in prompt', () => {
      const testCase = allTestCases[0];
      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      expect(prompt).toContain(testCase.variables.defendantName);
    });

    it('should include incident date in prompt', () => {
      const testCase = allTestCases[0];
      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      expect(prompt).toContain(testCase.variables.incidentDate);
    });
  });

  describe('Source Document Inclusion', () => {
    it('should include source documents in prompt', () => {
      const testCase = allTestCases[0];
      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      // Check for snippet of source document
      expect(prompt).toContain('EMERGENCY ROOM REPORT');
    });

    it('should preserve source document structure', () => {
      const testCase = allTestCases[2]; // Contract case with structured docs
      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      expect(prompt).toContain('Section 3.1');
      expect(prompt).toContain('WEBSITE DEVELOPMENT SERVICE AGREEMENT');
    });
  });

  describe('Template Structure', () => {
    it('should include template sections in prompt', () => {
      const testCase = allTestCases[0];
      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      // Should serialize template sections as JSON
      expect(prompt).toContain('Introduction');
      expect(prompt).toContain('Facts of the Case');
      expect(prompt).toContain('Liability');
      expect(prompt).toContain('Damages');
    });
  });

  describe('Prompt Type Specifics', () => {
    it('should include personal injury specific instructions', () => {
      const testCase = allTestCases[0]; // Auto accident
      const prompt = buildPrompt(
        'personal-injury',
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      expect(prompt).toContain('personal injury');
      expect(prompt).toContain('Medical Damages');
      expect(prompt).toContain('Pain and Suffering');
    });

    it('should include contract dispute specific instructions', () => {
      const testCase = allTestCases[2]; // Service agreement breach
      const prompt = buildPrompt(
        'contract-dispute',
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      expect(prompt).toContain('contract');
      expect(prompt).toContain('Contract Terms');
      expect(prompt).toContain('Breach Analysis');
    });

    it('should include citation format instructions', () => {
      const testCase = allTestCases[0];
      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      expect(prompt).toContain('[Source:');
    });
  });

  describe('Prompt Optimization', () => {
    it('should not have excessive whitespace', () => {
      const testCase = allTestCases[0];
      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        testCase.variables
      );

      // Should not have more than 2 consecutive newlines
      expect(prompt).not.toMatch(/\n{4,}/);
    });

    it('should generate prompts efficiently across all test cases', () => {
      const tokenCounts = allTestCases.map(testCase => {
        const prompt = buildPrompt(
          testCase.promptType,
          testCase.sourceDocuments,
          testCase.template,
          testCase.variables
        );
        return estimateTokenCount(prompt);
      });

      const avgTokens = tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length;
      const maxTokens = Math.max(...tokenCounts);

      console.log(`\nToken Usage Statistics:`);
      console.log(`  Average: ${avgTokens.toFixed(0)} tokens`);
      console.log(`  Maximum: ${maxTokens} tokens`);
      console.log(`  Target: <4000 tokens`);

      expect(avgTokens).toBeLessThan(3500); // Good average target
      expect(maxTokens).toBeLessThan(4000); // Hard limit
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional variables gracefully', () => {
      const testCase = allTestCases[0];
      const variablesWithoutOptional = {
        plaintiffName: testCase.variables.plaintiffName,
        defendantName: testCase.variables.defendantName,
        incidentDate: testCase.variables.incidentDate,
        incidentDescription: testCase.variables.incidentDescription,
        injuryType: testCase.variables.injuryType,
        medicalProviders: testCase.variables.medicalProviders,
      };

      const prompt = buildPrompt(
        testCase.promptType,
        testCase.sourceDocuments,
        testCase.template,
        variablesWithoutOptional
      );

      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should handle empty source documents', () => {
      const testCase = allTestCases[0];
      const prompt = buildPrompt(
        testCase.promptType,
        '', // Empty source documents
        testCase.template,
        testCase.variables
      );

      expect(prompt).toBeTruthy();
      expect(prompt).toContain('Source Documents');
    });
  });
});

describe('Token Estimation Accuracy', () => {
  it('should estimate tokens within reasonable margin', () => {
    const sampleText = 'This is a test sentence with exactly ten words here.';
    const estimated = estimateTokenCount(sampleText);

    // ~10 words should be roughly 13-18 tokens (accounting for punctuation)
    expect(estimated).toBeGreaterThan(10);
    expect(estimated).toBeLessThan(20);
  });

  it('should scale linearly with text length', () => {
    const shortText = 'Short text.';
    const longText = shortText.repeat(100);

    const shortTokens = estimateTokenCount(shortText);
    const longTokens = estimateTokenCount(longText);

    // Long text should be approximately 100x the tokens (within 25% margin)
    // Note: Estimation is approximate, actual ratio may vary slightly
    const ratio = longTokens / shortTokens;
    expect(ratio).toBeGreaterThan(75);
    expect(ratio).toBeLessThan(125);
  });
});
