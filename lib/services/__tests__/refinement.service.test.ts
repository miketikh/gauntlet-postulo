/**
 * Refinement Service Tests
 * Tests AI refinement functionality with streaming
 * Story 5.3 - Custom Prompt Refinement API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refineText, markRefinementApplied, verifyDraftAccess } from '../refinement.service';
import { db } from '@/lib/db/client';
import { streamText } from 'ai';

// Mock dependencies
vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    query: {
      aiRefinements: {
        findMany: vi.fn(),
      },
      drafts: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe('RefinementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('refineText', () => {
    it('should stream refined text chunks using quick action', async () => {
      // Mock streamText to return an async generator
      const mockTextStream = (async function* () {
        yield 'Refined ';
        yield 'text ';
        yield 'output';
      })();

      const mockUsage = Promise.resolve({
        promptTokens: 100,
        completionTokens: 50,
      });

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream,
        usage: mockUsage,
      } as any);

      // Mock database insert
      const mockRefinement = {
        id: 'refinement-id-123',
        draftId: 'draft-id-123',
        originalText: 'Original text',
        instruction: 'Make more assertive',
        refinedText: 'Refined text output',
        quickActionId: 'make-assertive',
        tokenUsage: { inputTokens: 100, outputTokens: 50 },
        model: 'gpt-4.1-mini',
        durationMs: 1000,
        applied: false,
        createdBy: 'user-id-123',
        createdAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockRefinement]),
        }),
      } as any);

      const request = {
        draftId: 'draft-id-123',
        selectedText: 'Original text',
        instruction: 'Make more assertive',
        quickActionId: 'make-assertive',
      };

      const generator = refineText(request, 'user-id-123');

      // Collect streamed chunks using manual iteration to get return value
      const chunks: string[] = [];
      let metadata: any = null;

      while (true) {
        const result = await generator.next();
        if (result.done) {
          metadata = result.value;
          break;
        }
        chunks.push(result.value);
      }

      // Verify streaming output
      expect(chunks).toEqual(['Refined ', 'text ', 'output']);

      // Verify metadata
      expect(metadata).toMatchObject({
        refinementId: 'refinement-id-123',
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 50,
        },
        model: 'gpt-4.1-mini',
      });
      expect(metadata.duration).toBeGreaterThanOrEqual(0);

      // Verify database insert was called
      expect(db.insert).toHaveBeenCalled();
    });

    it('should stream refined text chunks using custom instruction', async () => {
      const mockTextStream = (async function* () {
        yield 'Custom ';
        yield 'refined ';
        yield 'output';
      })();

      const mockUsage = Promise.resolve({
        promptTokens: 120,
        completionTokens: 60,
      });

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream,
        usage: mockUsage,
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'refinement-id-456',
            draftId: 'draft-id-456',
            originalText: 'Some text',
            instruction: 'Make it better',
            refinedText: 'Custom refined output',
            quickActionId: null,
            tokenUsage: { inputTokens: 120, outputTokens: 60 },
            model: 'gpt-4.1-mini',
            durationMs: 1200,
            applied: false,
            createdBy: 'user-id-456',
            createdAt: new Date(),
          }]),
        }),
      } as any);

      const request = {
        draftId: 'draft-id-456',
        selectedText: 'Some text',
        instruction: 'Make it better',
      };

      const generator = refineText(request, 'user-id-456');

      const chunks: string[] = [];
      let metadata: any = null;

      while (true) {
        const result = await generator.next();
        if (result.done) {
          metadata = result.value;
          break;
        }
        chunks.push(result.value);
      }

      expect(chunks).toEqual(['Custom ', 'refined ', 'output']);
      expect(metadata.refinementId).toBe('refinement-id-456');
    });

    it('should handle AI errors gracefully', async () => {
      vi.mocked(streamText).mockImplementation(() => {
        throw new Error('AI service unavailable');
      });

      const request = {
        draftId: 'draft-id-123',
        selectedText: 'Test text',
        instruction: 'Test instruction',
      };

      const generator = refineText(request, 'user-id-123');

      await expect(async () => {
        for await (const chunk of generator) {
          // Should throw before yielding any chunks
        }
      }).rejects.toThrow('AI refinement error: AI service unavailable');
    });

    it('should include context in refinement prompt', async () => {
      const mockTextStream = (async function* () {
        yield 'Output';
      })();

      const mockUsage = Promise.resolve({
        promptTokens: 100,
        completionTokens: 50,
      });

      let capturedPrompt = '';
      vi.mocked(streamText).mockImplementation((config: any) => {
        capturedPrompt = config.prompt;
        return {
          textStream: mockTextStream,
          usage: mockUsage,
        } as any;
      });

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'refinement-id-789',
            draftId: 'draft-id-789',
            originalText: 'Test',
            instruction: 'Test',
            refinedText: 'Output',
            quickActionId: null,
            tokenUsage: { inputTokens: 100, outputTokens: 50 },
            model: 'gpt-4.1-mini',
            durationMs: 1000,
            applied: false,
            createdBy: 'user-id-789',
            createdAt: new Date(),
          }]),
        }),
      } as any);

      const request = {
        draftId: 'draft-id-789',
        selectedText: 'Test text',
        instruction: 'Test instruction',
        context: {
          plaintiffName: 'John Doe',
          defendantName: 'ABC Corp',
          caseDescription: 'Personal injury case',
        },
      };

      const generator = refineText(request, 'user-id-789');

      for await (const chunk of generator) {
        // Consume generator
      }

      // Verify context was included in prompt
      expect(capturedPrompt).toContain('John Doe');
      expect(capturedPrompt).toContain('ABC Corp');
      expect(capturedPrompt).toContain('Personal injury case');
    });
  });

  describe('markRefinementApplied', () => {
    it('should mark refinement as applied', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      vi.mocked(db.update).mockImplementation(mockUpdate);

      await markRefinementApplied('refinement-id-123');

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('verifyDraftAccess', () => {
    it('should return draft if user has access', async () => {
      const mockDraft = {
        id: 'draft-id-123',
        projectId: 'project-id-123',
        project: {
          firmId: 'firm-id-123',
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      const result = await verifyDraftAccess('draft-id-123', 'firm-id-123');

      expect(result).toEqual(mockDraft);
    });

    it('should return null if draft not found', async () => {
      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(null);

      const result = await verifyDraftAccess('non-existent-id', 'firm-id-123');

      expect(result).toBeNull();
    });

    it('should return null if user does not have access', async () => {
      const mockDraft = {
        id: 'draft-id-123',
        projectId: 'project-id-123',
        project: {
          firmId: 'firm-id-456', // Different firm
        },
      };

      vi.mocked(db.query.drafts.findFirst).mockResolvedValue(mockDraft as any);

      const result = await verifyDraftAccess('draft-id-123', 'firm-id-123');

      expect(result).toBeNull();
    });
  });
});
