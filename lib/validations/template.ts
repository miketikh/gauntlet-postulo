/**
 * Template Validation Schemas
 * Defines Zod schemas for validating template structure and CRUD operations
 * Based on Story 3.2 Acceptance Criteria and Template Type definitions
 */

import { z } from 'zod';

/**
 * Section Type Validation
 */
export const sectionTypeSchema = z.enum(['static', 'ai_generated', 'variable']);

/**
 * Variable Type Validation
 */
export const variableTypeSchema = z.enum(['text', 'number', 'date', 'currency']);

/**
 * Template Section Schema (AC #3)
 * Validates the structure of a template section
 */
export const templateSectionSchema = z.object({
  id: z.string().uuid('Section ID must be a valid UUID'),
  title: z.string().min(1, 'Section title is required').max(255, 'Section title too long'),
  type: sectionTypeSchema,
  content: z.string().nullable(),
  promptGuidance: z.string().nullable(),
  required: z.boolean(),
  order: z.number().int().positive('Section order must be a positive integer'),
}).refine((data) => {
  // AI-generated sections must have prompt guidance
  if (data.type === 'ai_generated' && (!data.promptGuidance || data.promptGuidance.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'AI-generated sections must have prompt guidance',
  path: ['promptGuidance'],
});

/**
 * Template Variable Schema (AC #4)
 * Validates the structure of a template variable
 */
export const templateVariableSchema = z.object({
  name: z
    .string()
    .min(1, 'Variable name is required')
    .max(100, 'Variable name too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Variable name must contain only alphanumeric characters and underscores'),
  type: variableTypeSchema,
  required: z.boolean(),
  defaultValue: z.union([z.string(), z.number(), z.null()]),
});

/**
 * Create Template Request Schema
 * Validates POST /api/templates request body
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255, 'Template name too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  sections: z.array(templateSectionSchema).min(1, 'At least one section is required'),
  variables: z.array(templateVariableSchema).default([]),
}).refine((data) => {
  // Validate that variable names are unique
  const variableNames = data.variables.map(v => v.name);
  const uniqueNames = new Set(variableNames);
  return variableNames.length === uniqueNames.size;
}, {
  message: 'Variable names must be unique',
  path: ['variables'],
}).refine((data) => {
  // Validate that static/variable sections referencing variables only use defined variables
  const definedVariableNames = new Set(data.variables.map(v => v.name));
  const variablePattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;

  for (const section of data.sections) {
    if ((section.type === 'static' || section.type === 'variable') && section.content) {
      const matches = section.content.matchAll(variablePattern);
      for (const match of matches) {
        const varName = match[1];
        if (!definedVariableNames.has(varName)) {
          return false;
        }
      }
    }
  }
  return true;
}, {
  message: 'All variable references in sections must be defined in the variables array',
  path: ['sections'],
});

/**
 * Update Template Request Schema
 * Validates PUT /api/templates/:id request body
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255, 'Template name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  sections: z.array(templateSectionSchema).min(1, 'At least one section is required').optional(),
  variables: z.array(templateVariableSchema).optional(),
}).refine((data) => {
  // At least one field must be provided for update
  return data.name !== undefined ||
         data.description !== undefined ||
         data.sections !== undefined ||
         data.variables !== undefined;
}, {
  message: 'At least one field must be provided for update',
}).refine((data) => {
  // If variables are provided, validate uniqueness
  if (data.variables) {
    const variableNames = data.variables.map(v => v.name);
    const uniqueNames = new Set(variableNames);
    return variableNames.length === uniqueNames.size;
  }
  return true;
}, {
  message: 'Variable names must be unique',
  path: ['variables'],
});

/**
 * List Templates Query Parameters Schema
 * Validates GET /api/templates query parameters
 */
export const listTemplatesQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
}).refine((data) => {
  return data.page >= 1;
}, {
  message: 'Page must be at least 1',
  path: ['page'],
}).refine((data) => {
  return data.limit >= 1 && data.limit <= 100;
}, {
  message: 'Limit must be between 1 and 100',
  path: ['limit'],
});

/**
 * Restore Template Version Request Schema
 * Validates POST /api/templates/:id/versions/:version/restore
 */
export const restoreVersionSchema = z.object({
  changeDescription: z.string().max(500, 'Change description too long').optional().nullable(),
});
