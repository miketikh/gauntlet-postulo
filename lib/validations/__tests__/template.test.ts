/**
 * Unit Tests for Template Validation Schemas
 * Story 3.2 AC #10: Unit tests cover CRUD operations and validation logic
 */

import { describe, it, expect } from 'vitest';
import {
  templateSectionSchema,
  templateVariableSchema,
  createTemplateSchema,
  updateTemplateSchema,
  listTemplatesQuerySchema,
  restoreVersionSchema,
} from '../template';

describe('Template Validation Schemas', () => {
  describe('templateSectionSchema', () => {
    it('should validate a valid static section', () => {
      const validSection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Introduction',
        type: 'static',
        content: 'This is static content',
        promptGuidance: null,
        required: true,
        order: 1,
      };

      const result = templateSectionSchema.safeParse(validSection);
      expect(result.success).toBe(true);
    });

    it('should validate a valid AI-generated section', () => {
      const validSection = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Facts',
        type: 'ai_generated',
        content: null,
        promptGuidance: 'Generate a summary of the case facts',
        required: true,
        order: 2,
      };

      const result = templateSectionSchema.safeParse(validSection);
      expect(result.success).toBe(true);
    });

    it('should reject AI-generated section without prompt guidance', () => {
      const invalidSection = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Facts',
        type: 'ai_generated',
        content: null,
        promptGuidance: null,
        required: true,
        order: 2,
      };

      const result = templateSectionSchema.safeParse(invalidSection);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('prompt guidance');
      }
    });

    it('should reject section with empty title', () => {
      const invalidSection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '',
        type: 'static',
        content: 'Content',
        promptGuidance: null,
        required: true,
        order: 1,
      };

      const result = templateSectionSchema.safeParse(invalidSection);
      expect(result.success).toBe(false);
    });

    it('should reject section with invalid UUID', () => {
      const invalidSection = {
        id: 'not-a-uuid',
        title: 'Title',
        type: 'static',
        content: 'Content',
        promptGuidance: null,
        required: true,
        order: 1,
      };

      const result = templateSectionSchema.safeParse(invalidSection);
      expect(result.success).toBe(false);
    });
  });

  describe('templateVariableSchema', () => {
    it('should validate a valid text variable', () => {
      const validVariable = {
        name: 'plaintiff_name',
        type: 'text',
        required: true,
        defaultValue: 'John Doe',
      };

      const result = templateVariableSchema.safeParse(validVariable);
      expect(result.success).toBe(true);
    });

    it('should validate a valid currency variable', () => {
      const validVariable = {
        name: 'demand_amount',
        type: 'currency',
        required: true,
        defaultValue: 50000,
      };

      const result = templateVariableSchema.safeParse(validVariable);
      expect(result.success).toBe(true);
    });

    it('should reject variable with invalid name (spaces)', () => {
      const invalidVariable = {
        name: 'plaintiff name',
        type: 'text',
        required: true,
        defaultValue: null,
      };

      const result = templateVariableSchema.safeParse(invalidVariable);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('alphanumeric');
      }
    });

    it('should reject variable with invalid name (special chars)', () => {
      const invalidVariable = {
        name: 'plaintiff-name',
        type: 'text',
        required: true,
        defaultValue: null,
      };

      const result = templateVariableSchema.safeParse(invalidVariable);
      expect(result.success).toBe(false);
    });

    it('should allow underscores in variable names', () => {
      const validVariable = {
        name: 'plaintiff_first_name',
        type: 'text',
        required: true,
        defaultValue: null,
      };

      const result = templateVariableSchema.safeParse(validVariable);
      expect(result.success).toBe(true);
    });
  });

  describe('createTemplateSchema', () => {
    it('should validate a complete valid template', () => {
      const validTemplate = {
        name: 'Personal Injury Template',
        description: 'Template for personal injury cases',
        sections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Introduction',
            type: 'static',
            content: 'Dear {{defendant_name}},',
            promptGuidance: null,
            required: true,
            order: 1,
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Facts',
            type: 'ai_generated',
            content: null,
            promptGuidance: 'Summarize the facts of the case',
            required: true,
            order: 2,
          },
        ],
        variables: [
          {
            name: 'defendant_name',
            type: 'text',
            required: true,
            defaultValue: null,
          },
          {
            name: 'demand_amount',
            type: 'currency',
            required: true,
            defaultValue: null,
          },
        ],
      };

      const result = createTemplateSchema.safeParse(validTemplate);
      expect(result.success).toBe(true);
    });

    it('should reject template with no sections', () => {
      const invalidTemplate = {
        name: 'Test Template',
        sections: [],
        variables: [],
      };

      const result = createTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one section');
      }
    });

    it('should reject template with duplicate variable names', () => {
      const invalidTemplate = {
        name: 'Test Template',
        sections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Section',
            type: 'static',
            content: 'Content',
            promptGuidance: null,
            required: true,
            order: 1,
          },
        ],
        variables: [
          {
            name: 'plaintiff_name',
            type: 'text',
            required: true,
            defaultValue: null,
          },
          {
            name: 'plaintiff_name',
            type: 'text',
            required: true,
            defaultValue: null,
          },
        ],
      };

      const result = createTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('unique');
      }
    });

    it('should reject template with undefined variable reference', () => {
      const invalidTemplate = {
        name: 'Test Template',
        sections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Section',
            type: 'static',
            content: 'Dear {{undefined_variable}},',
            promptGuidance: null,
            required: true,
            order: 1,
          },
        ],
        variables: [
          {
            name: 'defined_variable',
            type: 'text',
            required: true,
            defaultValue: null,
          },
        ],
      };

      const result = createTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('defined');
      }
    });

    it('should validate template with valid variable references', () => {
      const validTemplate = {
        name: 'Test Template',
        sections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Section',
            type: 'static',
            content: 'Dear {{plaintiff_name}}, your demand is {{demand_amount}}',
            promptGuidance: null,
            required: true,
            order: 1,
          },
        ],
        variables: [
          {
            name: 'plaintiff_name',
            type: 'text',
            required: true,
            defaultValue: null,
          },
          {
            name: 'demand_amount',
            type: 'currency',
            required: true,
            defaultValue: null,
          },
        ],
      };

      const result = createTemplateSchema.safeParse(validTemplate);
      expect(result.success).toBe(true);
    });
  });

  describe('updateTemplateSchema', () => {
    it('should validate partial update (name only)', () => {
      const partialUpdate = {
        name: 'Updated Template Name',
      };

      const result = updateTemplateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate partial update (sections only)', () => {
      const partialUpdate = {
        sections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Section',
            type: 'static',
            content: 'Content',
            promptGuidance: null,
            required: true,
            order: 1,
          },
        ],
      };

      const result = updateTemplateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject empty update', () => {
      const emptyUpdate = {};

      const result = updateTemplateSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one field');
      }
    });
  });

  describe('listTemplatesQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const query = {
        search: 'personal injury',
        isActive: 'true',
        page: '2',
        limit: '10',
      };

      const result = listTemplatesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
        expect(result.data.isActive).toBe(true);
      }
    });

    it('should use defaults for missing parameters', () => {
      const query = {};

      const result = listTemplatesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject page < 1', () => {
      const query = {
        page: '0',
      };

      const result = listTemplatesQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it('should reject limit > 100', () => {
      const query = {
        limit: '101',
      };

      const result = listTemplatesQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  describe('restoreVersionSchema', () => {
    it('should validate empty body', () => {
      const result = restoreVersionSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate with change description', () => {
      const body = {
        changeDescription: 'Restored to previous version',
      };

      const result = restoreVersionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it('should reject description that is too long', () => {
      const body = {
        changeDescription: 'x'.repeat(501),
      };

      const result = restoreVersionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });
  });
});
