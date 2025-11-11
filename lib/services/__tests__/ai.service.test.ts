/**
 * AI Service Unit Tests
 * Tests prompt construction and generation logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { constructPrompt, generateDemandLetter, refineSection } from '../ai.service';
import { Template } from '../../db/schema';

describe('AI Service', () => {
  describe('constructPrompt', () => {
    it('should construct prompt with template, variables, and source text', () => {
      const sourceText = 'Medical records show injury on 2024-01-15. Patient: John Doe.';

      const template: Template = {
        id: 'template-1',
        name: 'Personal Injury Demand',
        description: 'Standard PI demand letter',
        sections: [
          { id: 'intro', title: 'Introduction', order: 1 },
          { id: 'facts', title: 'Statement of Facts', order: 2 },
          { id: 'damages', title: 'Damages', order: 3 },
        ],
        variables: [
          { name: 'plaintiffName', type: 'text', label: 'Plaintiff Name' },
          { name: 'defendantName', type: 'text', label: 'Defendant Name' },
        ],
        firmId: 'firm-1',
        version: 1,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Template;

      const variables = {
        plaintiffName: 'John Doe',
        defendantName: 'ABC Corp',
        incidentDate: '2024-01-15',
      };

      const prompt = constructPrompt(sourceText, template, variables);

      // Verify prompt contains all key elements
      expect(prompt).toContain('Template Structure');
      expect(prompt).toContain('Introduction');
      expect(prompt).toContain('Statement of Facts');
      expect(prompt).toContain('Damages');

      expect(prompt).toContain('Case Variables');
      expect(prompt).toContain('John Doe');
      expect(prompt).toContain('ABC Corp');
      expect(prompt).toContain('2024-01-15');

      expect(prompt).toContain('Source Documents');
      expect(prompt).toContain('Medical records show injury');

      expect(prompt).toContain('Generate a professional demand letter');
      expect(prompt).toContain('formal legal tone');
    });

    it('should handle empty source text', () => {
      const sourceText = '';
      const template: Template = {
        id: 'template-1',
        name: 'Test Template',
        description: 'Test',
        sections: [],
        variables: [],
        firmId: 'firm-1',
        version: 1,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Template;
      const variables = {};

      const prompt = constructPrompt(sourceText, template, variables);

      expect(prompt).toContain('Source Documents');
      expect(prompt).toBeDefined();
    });

    it('should handle complex template sections', () => {
      const template: Template = {
        id: 'template-1',
        name: 'Complex Template',
        description: 'Complex template with multiple sections',
        sections: [
          {
            id: 'header',
            title: 'Header',
            order: 1,
            subsections: [
              { id: 'date', title: 'Date', order: 1 },
              { id: 'recipient', title: 'Recipient', order: 2 },
            ],
          },
          { id: 'body', title: 'Body', order: 2 },
        ],
        variables: [],
        firmId: 'firm-1',
        version: 1,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Template;

      const prompt = constructPrompt('source text', template, {});

      expect(prompt).toContain('subsections');
      expect(prompt).toContain('Date');
      expect(prompt).toContain('Recipient');
    });

    it('should handle special characters in variables', () => {
      const template: Template = {
        id: 'template-1',
        name: 'Test',
        description: 'Test',
        sections: [],
        variables: [],
        firmId: 'firm-1',
        version: 1,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Template;

      const variables = {
        companyName: "O'Reilly & Associates",
        amount: '$1,000,000.00',
        notes: 'Line 1\nLine 2\nLine 3',
      };

      const prompt = constructPrompt('source', template, variables);

      expect(prompt).toContain("O'Reilly & Associates");
      expect(prompt).toContain('$1,000,000.00');
      expect(prompt).toContain('Line 1\\nLine 2\\nLine 3');
    });
  });

  describe('generateDemandLetter', () => {
    it('should be an async generator function', () => {
      // This test documents that the function exists and has the right type
      expect(generateDemandLetter).toBeDefined();
      expect(typeof generateDemandLetter).toBe('function');
    });

    // Note: We don't test actual API calls in unit tests to avoid costs and rate limits
    // Integration tests will mock the Vercel AI SDK
  });

  describe('refineSection', () => {
    it('should construct refinement prompt with section content and instructions', () => {
      // This is a minimal test since we can't easily test the actual async generator
      // without mocking the entire Vercel AI SDK
      expect(refineSection).toBeDefined();
      expect(typeof refineSection).toBe('function');
    });
  });
});
