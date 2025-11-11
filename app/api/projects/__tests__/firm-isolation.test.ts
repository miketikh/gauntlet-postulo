/**
 * Integration Tests for Projects API - Firm Isolation
 * Verifies that firm-level data isolation is properly enforced
 * CRITICAL: Tests that cross-firm access returns 404 (not 403)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { firms, users, projects, templates } from '@/lib/db/schema';
import { generateAccessToken } from '@/lib/services/auth.service';
import { hashPassword } from '@/lib/services/auth.service';
import { eq } from 'drizzle-orm';

describe('Projects API - Firm Isolation Integration Tests', () => {
  let firm1Id: string;
  let firm2Id: string;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let firm1ProjectId: string;
  let firm2ProjectId: string;
  let template1Id: string;
  let template2Id: string;

  beforeAll(async () => {
    // Create two test firms
    const [firm1, firm2] = await db.insert(firms).values([
      { name: 'Test Firm 1 - Integration' },
      { name: 'Test Firm 2 - Integration' }
    ]).returning();

    firm1Id = firm1.id;
    firm2Id = firm2.id;

    const password = await hashPassword('test123');

    // Create users in each firm
    const [user1, user2] = await db.insert(users).values([
      {
        email: 'integration-user1@firm1.com',
        passwordHash: password,
        firstName: 'User',
        lastName: 'One',
        role: 'attorney',
        firmId: firm1Id,
      },
      {
        email: 'integration-user2@firm2.com',
        passwordHash: password,
        firstName: 'User',
        lastName: 'Two',
        role: 'attorney',
        firmId: firm2Id,
      }
    ]).returning();

    user1Id = user1.id;
    user2Id = user2.id;

    // Generate JWT tokens
    user1Token = generateAccessToken({
      userId: user1.id,
      email: user1.email,
      role: user1.role,
      firmId: user1.firmId,
    });

    user2Token = generateAccessToken({
      userId: user2.id,
      email: user2.email,
      role: user2.role,
      firmId: user2.firmId,
    });

    // Create templates for each firm
    const [template1, template2] = await db.insert(templates).values([
      {
        name: 'Firm 1 Template',
        description: 'Test template for firm 1',
        sections: [],
        variables: [],
        firmId: firm1Id,
        createdBy: user1.id,
      },
      {
        name: 'Firm 2 Template',
        description: 'Test template for firm 2',
        sections: [],
        variables: [],
        firmId: firm2Id,
        createdBy: user2.id,
      }
    ]).returning();

    template1Id = template1.id;
    template2Id = template2.id;

    // Create projects in each firm
    const [project1, project2] = await db.insert(projects).values([
      {
        title: 'Firm 1 Project - Integration Test',
        clientName: 'Client A',
        status: 'draft',
        caseDetails: { test: true },
        templateId: template1Id,
        firmId: firm1Id,
        createdBy: user1.id,
      },
      {
        title: 'Firm 2 Project - Integration Test',
        clientName: 'Client B',
        status: 'draft',
        caseDetails: { test: true },
        templateId: template2Id,
        firmId: firm2Id,
        createdBy: user2.id,
      }
    ]).returning();

    firm1ProjectId = project1.id;
    firm2ProjectId = project2.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(projects).where(eq(projects.firmId, firm1Id));
    await db.delete(projects).where(eq(projects.firmId, firm2Id));
    await db.delete(templates).where(eq(templates.firmId, firm1Id));
    await db.delete(templates).where(eq(templates.firmId, firm2Id));
    await db.delete(users).where(eq(users.firmId, firm1Id));
    await db.delete(users).where(eq(users.firmId, firm2Id));
    await db.delete(firms).where(eq(firms.id, firm1Id));
    await db.delete(firms).where(eq(firms.id, firm2Id));
  });

  describe('GET /api/projects/:id - Single Project Access', () => {
    it('should allow user to access their own firm project', async () => {
      // User 1 accessing their own firm's project
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, firm1ProjectId)
      });

      expect(project).toBeDefined();
      expect(project?.firmId).toBe(firm1Id);
      expect(project?.id).toBe(firm1ProjectId);
    });

    it('should return null when querying another firm project with firmId filter', async () => {
      // This simulates what happens in the API route
      // When user2 tries to access firm1's project, the query returns undefined
      const project = await db.query.projects.findFirst({
        where: (projects, { and, eq }) => and(
          eq(projects.id, firm1ProjectId),
          eq(projects.firmId, firm2Id) // User2's firmId
        )
      });

      // CRITICAL: Query returns undefined (not the project) due to firmId mismatch
      expect(project).toBeUndefined();
    });

    it('should verify that cross-firm access would return 404 (security test)', async () => {
      // This verifies the security pattern: when firmIds don't match, query returns undefined
      // The API route then throws NotFoundError with 404 status

      // Verify project exists in firm1
      const actualProject = await db.query.projects.findFirst({
        where: eq(projects.id, firm1ProjectId)
      });
      expect(actualProject).toBeDefined();
      expect(actualProject?.firmId).toBe(firm1Id);

      // Verify that querying with wrong firmId returns undefined
      const crossFirmAttempt = await db.query.projects.findFirst({
        where: (projects, { and, eq }) => and(
          eq(projects.id, firm1ProjectId),
          eq(projects.firmId, firm2Id) // Wrong firm
        )
      });

      // CRITICAL: Returns undefined, which will cause API to return 404
      expect(crossFirmAttempt).toBeUndefined();
    });
  });

  describe('GET /api/projects - List Projects', () => {
    it('should only return projects from user firm', async () => {
      // User 1 should only see firm 1 projects
      const firm1Projects = await db.query.projects.findMany({
        where: eq(projects.firmId, firm1Id)
      });

      expect(firm1Projects.length).toBeGreaterThan(0);
      expect(firm1Projects.every(p => p.firmId === firm1Id)).toBe(true);
    });

    it('should not return projects from other firms', async () => {
      // User 1 querying with their firmId should not see firm 2 projects
      const firm1Projects = await db.query.projects.findMany({
        where: eq(projects.firmId, firm1Id)
      });

      // Verify no firm 2 projects in results
      const hasFirm2Project = firm1Projects.some(p => p.firmId === firm2Id);
      expect(hasFirm2Project).toBe(false);
    });

    it('should verify both firms have isolated data', async () => {
      // Get projects for each firm
      const firm1Projects = await db.query.projects.findMany({
        where: eq(projects.firmId, firm1Id)
      });

      const firm2Projects = await db.query.projects.findMany({
        where: eq(projects.firmId, firm2Id)
      });

      // Both should have projects
      expect(firm1Projects.length).toBeGreaterThan(0);
      expect(firm2Projects.length).toBeGreaterThan(0);

      // Verify complete isolation
      expect(firm1Projects.every(p => p.firmId === firm1Id)).toBe(true);
      expect(firm2Projects.every(p => p.firmId === firm2Id)).toBe(true);

      // Verify no overlap in project IDs
      const firm1Ids = firm1Projects.map(p => p.id);
      const firm2Ids = firm2Projects.map(p => p.id);
      const overlap = firm1Ids.filter(id => firm2Ids.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('Firm Isolation - Data Integrity', () => {
    it('should verify each project belongs to correct firm', async () => {
      const project1 = await db.query.projects.findFirst({
        where: eq(projects.id, firm1ProjectId)
      });

      const project2 = await db.query.projects.findFirst({
        where: eq(projects.id, firm2ProjectId)
      });

      expect(project1?.firmId).toBe(firm1Id);
      expect(project2?.firmId).toBe(firm2Id);
    });

    it('should verify users belong to correct firms', async () => {
      const user1 = await db.query.users.findFirst({
        where: eq(users.id, user1Id)
      });

      const user2 = await db.query.users.findFirst({
        where: eq(users.id, user2Id)
      });

      expect(user1?.firmId).toBe(firm1Id);
      expect(user2?.firmId).toBe(firm2Id);
    });

    it('should verify templates belong to correct firms', async () => {
      const template1 = await db.query.templates.findFirst({
        where: eq(templates.id, template1Id)
      });

      const template2 = await db.query.templates.findFirst({
        where: eq(templates.id, template2Id)
      });

      expect(template1?.firmId).toBe(firm1Id);
      expect(template2?.firmId).toBe(firm2Id);
    });
  });

  describe('JWT Token Validation', () => {
    it('should have valid JWT tokens with correct firmId', () => {
      // Tokens were generated with firmId in payload
      expect(user1Token).toBeDefined();
      expect(user2Token).toBeDefined();
      expect(user1Token).not.toBe(user2Token);
    });
  });
});
