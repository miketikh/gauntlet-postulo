/**
 * Audit Service Tests
 * Story 6.8 - Test audit logging functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db/client';
import { auditLogs, users, firms } from '@/lib/db/schema';
import { logAudit, getAuditLogs, getAuditLogCount, AUDIT_ACTIONS, RESOURCE_TYPES } from '../audit.service';
import { eq } from 'drizzle-orm';

describe('Audit Service', () => {
  let testFirmId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test firm
    const [firm] = await db
      .insert(firms)
      .values({
        name: 'Test Audit Firm',
      })
      .returning();
    testFirmId = firm.id;

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'audit-test@example.com',
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
        role: 'attorney',
        firmId: testFirmId,
      })
      .returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up: Delete test data
    await db.delete(auditLogs).where(eq(auditLogs.firmId, testFirmId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(firms).where(eq(firms.id, testFirmId));
  });

  it('should log an audit event', async () => {
    await logAudit({
      firmId: testFirmId,
      userId: testUserId,
      action: AUDIT_ACTIONS.DRAFT_VIEW,
      resourceType: RESOURCE_TYPES.DRAFT,
      resourceId: 'test-draft-id',
      metadata: {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
    });

    const logs = await getAuditLogs(testFirmId, {
      action: AUDIT_ACTIONS.DRAFT_VIEW,
      limit: 1,
    });

    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe(AUDIT_ACTIONS.DRAFT_VIEW);
    expect(logs[0].resourceType).toBe(RESOURCE_TYPES.DRAFT);
    expect(logs[0].resourceId).toBe('test-draft-id');
    expect(logs[0].metadata?.ipAddress).toBe('192.168.1.1');
  });

  it('should filter audit logs by userId', async () => {
    await logAudit({
      firmId: testFirmId,
      userId: testUserId,
      action: AUDIT_ACTIONS.PROJECT_CREATE,
      resourceType: RESOURCE_TYPES.PROJECT,
      resourceId: 'test-project-id',
    });

    const logs = await getAuditLogs(testFirmId, {
      userId: testUserId,
      action: AUDIT_ACTIONS.PROJECT_CREATE,
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].userId).toBe(testUserId);
  });

  it('should filter audit logs by date range', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await logAudit({
      firmId: testFirmId,
      userId: testUserId,
      action: AUDIT_ACTIONS.EXPORT_CREATE,
      resourceType: RESOURCE_TYPES.EXPORT,
      resourceId: 'test-export-id',
    });

    const logs = await getAuditLogs(testFirmId, {
      startDate: yesterday,
      endDate: tomorrow,
      action: AUDIT_ACTIONS.EXPORT_CREATE,
    });

    expect(logs.length).toBeGreaterThan(0);
  });

  it('should get correct audit log count', async () => {
    // Log a few events
    await logAudit({
      firmId: testFirmId,
      userId: testUserId,
      action: AUDIT_ACTIONS.AI_GENERATE,
      resourceType: RESOURCE_TYPES.PROJECT,
    });

    const count = await getAuditLogCount(testFirmId, {
      action: AUDIT_ACTIONS.AI_GENERATE,
    });

    expect(count).toBeGreaterThan(0);
  });

  it('should include user data in audit logs', async () => {
    await logAudit({
      firmId: testFirmId,
      userId: testUserId,
      action: AUDIT_ACTIONS.TEMPLATE_CREATE,
      resourceType: RESOURCE_TYPES.TEMPLATE,
    });

    const logs = await getAuditLogs(testFirmId, {
      action: AUDIT_ACTIONS.TEMPLATE_CREATE,
      limit: 1,
    });

    expect(logs.length).toBe(1);
    expect(logs[0].user).toBeDefined();
    expect(logs[0].user?.email).toBe('audit-test@example.com');
  });

  it('should handle pagination with limit and offset', async () => {
    // Create multiple log entries
    for (let i = 0; i < 5; i++) {
      await logAudit({
        firmId: testFirmId,
        userId: testUserId,
        action: AUDIT_ACTIONS.DOCUMENT_VIEW,
        resourceType: RESOURCE_TYPES.DOCUMENT,
      });
    }

    const firstPage = await getAuditLogs(testFirmId, {
      action: AUDIT_ACTIONS.DOCUMENT_VIEW,
      limit: 2,
      offset: 0,
    });

    const secondPage = await getAuditLogs(testFirmId, {
      action: AUDIT_ACTIONS.DOCUMENT_VIEW,
      limit: 2,
      offset: 2,
    });

    expect(firstPage.length).toBe(2);
    expect(secondPage.length).toBe(2);
    expect(firstPage[0].id).not.toBe(secondPage[0].id);
  });

  it('should not throw when logging fails', async () => {
    // This should not throw even with invalid data
    await expect(
      logAudit({
        firmId: 'invalid-uuid', // Invalid UUID
        userId: testUserId,
        action: AUDIT_ACTIONS.DRAFT_VIEW,
      })
    ).resolves.not.toThrow();
  });
});
