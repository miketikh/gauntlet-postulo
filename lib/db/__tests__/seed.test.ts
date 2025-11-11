/**
 * Seed Script Validation Tests
 * Tests that the seed script creates default templates correctly for Story 3.10
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../client';
import { firms, users, templates, templateVersions } from '../schema';
import { eq, and } from 'drizzle-orm';

describe('Seed Script - Default Templates (Story 3.10)', () => {
  let testFirms: any[];
  let testUsers: any[];
  let testTemplates: any[];

  beforeAll(async () => {
    // Fetch seeded data
    testFirms = await db.select().from(firms);
    testUsers = await db.select().from(users);
    testTemplates = await db.select().from(templates);
  });

  describe('AC #1: Database seed creates 2-3 default templates for each firm', () => {
    it('should create exactly 3 firms', () => {
      expect(testFirms.length).toBe(3);
    });

    it('should create 3 templates per firm (9 total)', () => {
      expect(testTemplates.length).toBe(9);
    });

    it('should have 3 templates for each firm', () => {
      testFirms.forEach(firm => {
        const firmTemplates = testTemplates.filter(t => t.firmId === firm.id);
        expect(firmTemplates.length).toBe(3);
      });
    });
  });

  describe('AC #2: Templates include required types', () => {
    it('should include Personal Injury Demand Letter template for each firm', () => {
      testFirms.forEach(firm => {
        const personalInjuryTemplate = testTemplates.find(
          t => t.firmId === firm.id && t.name === 'Personal Injury Demand Letter'
        );
        expect(personalInjuryTemplate).toBeDefined();
        expect(personalInjuryTemplate?.description).toContain('personal injury');
      });
    });

    it('should include Contract Dispute Demand Letter template for each firm', () => {
      testFirms.forEach(firm => {
        const contractTemplate = testTemplates.find(
          t => t.firmId === firm.id && t.name === 'Contract Dispute Demand Letter'
        );
        expect(contractTemplate).toBeDefined();
        expect(contractTemplate?.description).toContain('contract');
      });
    });

    it('should include Property Damage Demand Letter template for each firm', () => {
      testFirms.forEach(firm => {
        const propertyDamageTemplate = testTemplates.find(
          t => t.firmId === firm.id && t.name === 'Property Damage Demand Letter'
        );
        expect(propertyDamageTemplate).toBeDefined();
        expect(propertyDamageTemplate?.description).toContain('property damage');
      });
    });
  });

  describe('AC #3: Default templates marked as system templates', () => {
    it('should mark all seeded templates as system templates', () => {
      testTemplates.forEach(template => {
        expect(template.isSystemTemplate).toBe(true);
      });
    });

    it('should have all system templates active', () => {
      testTemplates.forEach(template => {
        expect(template.isActive).toBe(true);
      });
    });
  });

  describe('AC #4: Personal Injury template structure', () => {
    let personalInjuryTemplate: any;

    beforeAll(() => {
      personalInjuryTemplate = testTemplates.find(
        t => t.name === 'Personal Injury Demand Letter'
      );
    });

    it('should have required sections', () => {
      expect(personalInjuryTemplate).toBeDefined();
      const sections = personalInjuryTemplate.sections as any[];
      expect(sections.length).toBeGreaterThanOrEqual(8);

      const sectionTitles = sections.map((s: any) => s.title);
      expect(sectionTitles).toContain('Introduction');
      expect(sectionTitles).toContain('Statement of Facts');
      expect(sectionTitles).toContain('Nature and Extent of Injuries');
      expect(sectionTitles).toContain('Medical Expenses');
      expect(sectionTitles).toContain('Pain and Suffering');
      expect(sectionTitles).toContain('Summary of Damages');
      expect(sectionTitles).toContain('Settlement Demand');
    });

    it('should have AI-generated sections with prompt guidance', () => {
      const sections = personalInjuryTemplate.sections as any[];
      const aiGeneratedSections = sections.filter((s: any) => s.type === 'ai_generated');

      expect(aiGeneratedSections.length).toBeGreaterThan(0);

      aiGeneratedSections.forEach((section: any) => {
        expect(section.promptGuidance).toBeDefined();
        expect(section.promptGuidance).not.toBeNull();
        expect(section.promptGuidance.length).toBeGreaterThan(20);
      });
    });

    it('should have required variables defined', () => {
      const variables = personalInjuryTemplate.variables as any[];
      const variableNames = variables.map((v: any) => v.name);

      expect(variableNames).toContain('plaintiff_name');
      expect(variableNames).toContain('defendant_name');
      expect(variableNames).toContain('incident_date');
      expect(variableNames).toContain('medical_expenses');
      expect(variableNames).toContain('total_demand');
      expect(variableNames).toContain('attorney_name');
      expect(variableNames).toContain('firm_name');
    });

    it('should have variables with correct types', () => {
      const variables = personalInjuryTemplate.variables as any[];

      const plaintiffName = variables.find((v: any) => v.name === 'plaintiff_name');
      expect(plaintiffName?.type).toBe('text');
      expect(plaintiffName?.required).toBe(true);

      const medicalExpenses = variables.find((v: any) => v.name === 'medical_expenses');
      expect(medicalExpenses?.type).toBe('currency');
      expect(medicalExpenses?.required).toBe(true);

      const incidentDate = variables.find((v: any) => v.name === 'incident_date');
      expect(incidentDate?.type).toBe('date');
      expect(incidentDate?.required).toBe(true);
    });
  });

  describe('AC #5: Contract Dispute template structure', () => {
    let contractTemplate: any;

    beforeAll(() => {
      contractTemplate = testTemplates.find(
        t => t.name === 'Contract Dispute Demand Letter'
      );
    });

    it('should have required sections', () => {
      expect(contractTemplate).toBeDefined();
      const sections = contractTemplate.sections as any[];
      expect(sections.length).toBeGreaterThanOrEqual(7);

      const sectionTitles = sections.map((s: any) => s.title);
      expect(sectionTitles).toContain('Introduction');
      expect(sectionTitles).toContain('Contract Summary');
      expect(sectionTitles).toContain('Defendant\'s Breach');
      expect(sectionTitles).toContain('Damages');
      expect(sectionTitles).toContain('Demand for Relief');
    });

    it('should have contract-specific variables', () => {
      const variables = contractTemplate.variables as any[];
      const variableNames = variables.map((v: any) => v.name);

      expect(variableNames).toContain('contract_type');
      expect(variableNames).toContain('contract_date');
      expect(variableNames).toContain('direct_damages');
      expect(variableNames).toContain('remedy_sought');
    });
  });

  describe('AC #6: Property Damage template structure', () => {
    let propertyDamageTemplate: any;

    beforeAll(() => {
      propertyDamageTemplate = testTemplates.find(
        t => t.name === 'Property Damage Demand Letter'
      );
    });

    it('should have required sections', () => {
      expect(propertyDamageTemplate).toBeDefined();
      const sections = propertyDamageTemplate.sections as any[];
      expect(sections.length).toBeGreaterThanOrEqual(9);

      const sectionTitles = sections.map((s: any) => s.title);
      expect(sectionTitles).toContain('Introduction');
      expect(sectionTitles).toContain('Incident Description');
      expect(sectionTitles).toContain('Nature and Extent of Property Damage');
      expect(sectionTitles).toContain('Repair and Restoration Costs');
      expect(sectionTitles).toContain('Settlement Demand');
    });

    it('should have property-damage-specific variables', () => {
      const variables = propertyDamageTemplate.variables as any[];
      const variableNames = variables.map((v: any) => v.name);

      expect(variableNames).toContain('property_type');
      expect(variableNames).toContain('repair_costs');
      expect(variableNames).toContain('replacement_costs');
      expect(variableNames).toContain('diminished_value');
    });
  });

  describe('AC #7: Template version history', () => {
    it('should create version 1 record for each template', async () => {
      const versions = await db.select().from(templateVersions);

      // Should have 9 version records (3 templates × 3 firms)
      expect(versions.length).toBe(9);

      // All should be version 1
      versions.forEach(version => {
        expect(version.versionNumber).toBe(1);
      });
    });

    it('should store sections and variables in version structure', async () => {
      const versions = await db.select().from(templateVersions);

      versions.forEach(version => {
        const structure = version.structure as any;
        expect(structure).toBeDefined();
        expect(structure.sections).toBeDefined();
        expect(structure.variables).toBeDefined();
        expect(Array.isArray(structure.sections)).toBe(true);
        expect(Array.isArray(structure.variables)).toBe(true);
      });
    });
  });

  describe('AC #8: Variable validation', () => {
    it('should have unique variable names within each template', () => {
      testTemplates.forEach(template => {
        const variables = template.variables as any[];
        const variableNames = variables.map((v: any) => v.name);
        const uniqueNames = new Set(variableNames);

        expect(variableNames.length).toBe(uniqueNames.size);
      });
    });

    it('should have all variables used in sections defined in variables array', () => {
      testTemplates.forEach(template => {
        const sections = template.sections as any[];
        const variables = template.variables as any[];
        const definedVariableNames = new Set(variables.map((v: any) => v.name));

        const variablePattern = /\{\{([a-zA-Z0-9_]+)\}\}/g;

        sections.forEach((section: any) => {
          if ((section.type === 'static' || section.type === 'variable') && section.content) {
            const matches = [...section.content.matchAll(variablePattern)];
            matches.forEach(match => {
              const varName = match[1];
              expect(definedVariableNames.has(varName)).toBe(true);
            });
          }
        });
      });
    });
  });

  describe('AC #9: Section ordering', () => {
    it('should have sections with sequential ordering', () => {
      testTemplates.forEach(template => {
        const sections = template.sections as any[];
        const orders = sections.map((s: any) => s.order).sort((a: number, b: number) => a - b);

        // Check that orders start at 1 and increment by 1
        expect(orders[0]).toBe(1);
        for (let i = 1; i < orders.length; i++) {
          expect(orders[i]).toBe(orders[i - 1] + 1);
        }
      });
    });
  });

  describe('AC #10: Section types', () => {
    it('should have valid section types', () => {
      const validTypes = ['static', 'ai_generated', 'variable'];

      testTemplates.forEach(template => {
        const sections = template.sections as any[];
        sections.forEach((section: any) => {
          expect(validTypes).toContain(section.type);
        });
      });
    });

    it('should have mix of section types in each template', () => {
      testTemplates.forEach(template => {
        const sections = template.sections as any[];
        const sectionTypes = new Set(sections.map((s: any) => s.type));

        // Each template should have at least 2 different section types
        expect(sectionTypes.size).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
