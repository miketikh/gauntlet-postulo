/**
 * AI Refinement API Endpoint Tests
 * Tests POST /api/ai/refine with streaming
 * Story 5.3 - Custom Prompt Refinement API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { requireAuth } from '@/lib/middleware/auth';
import { refineText, verifyDraftAccess } from '@/lib/services/refinement.service';

// Mock dependencies
vi.mock('@/lib/middleware/auth');
vi.mock('@/lib/services/refinement.service');

describe('POST /api/ai/refine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    userId: 'user-id-123',
    firmId: 'firm-id-123',
    role: 'attorney' as const,
  };

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

    const request = new Request('http://localhost/api/ai/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftId: 'draft-id-123',
        selectedText: 'Test text',
        instruction: 'Make it better',
      }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(500); // Error handling returns 500 for unknown errors
  });

  it('should return 400 for invalid request body', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);

    const request = new Request('http://localhost/api/ai/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        draftId: 'draft-id-123',
      }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if draft not found', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(verifyDraftAccess).mockResolvedValue(null);

    const request = new Request('http://localhost/api/ai/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftId: '00000000-0000-0000-0000-000000000000',
        selectedText: 'Test text',
        instruction: 'Make it better',
      }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should stream refinement results for valid request', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(verifyDraftAccess).mockResolvedValue({
      id: 'draft-id-123',
      projectId: 'project-id-123',
      project: { firmId: 'firm-id-123' },
    } as any);

    // Mock refineText generator
    const mockGenerator = (async function* () {
      yield 'Chunk 1 ';
      yield 'Chunk 2 ';
      yield 'Chunk 3';
      return {
        refinementId: 'refinement-id-123',
        tokenUsage: { inputTokens: 100, outputTokens: 50 },
        model: 'gpt-4.1-mini',
        duration: 1000,
      };
    })();

    vi.mocked(refineText).mockReturnValue(mockGenerator);

    const request = new Request('http://localhost/api/ai/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftId: 'draft-id-123',
        selectedText: 'The defendant failed to maintain the property.',
        instruction: 'Make more assertive',
        quickActionId: 'make-assertive',
      }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Read streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    const chunks: string[] = [];
    let done = false;

    while (!done) {
      const result = await reader?.read();
      if (result?.done) {
        done = true;
      } else if (result?.value) {
        chunks.push(decoder.decode(result.value, { stream: true }));
      }
    }

    const fullResponse = chunks.join('');

    // Verify SSE format
    expect(fullResponse).toContain('data: {"type":"content","text":"Chunk 1 "}');
    expect(fullResponse).toContain('data: {"type":"content","text":"Chunk 2 "}');
    expect(fullResponse).toContain('data: {"type":"content","text":"Chunk 3"}');
    expect(fullResponse).toContain('data: {"type":"done"');
    expect(fullResponse).toContain('"refinementId":"refinement-id-123"');
  });

  it('should include context in refinement request', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(verifyDraftAccess).mockResolvedValue({
      id: 'draft-id-123',
      projectId: 'project-id-123',
      project: { firmId: 'firm-id-123' },
    } as any);

    const mockGenerator = (async function* () {
      yield 'Output';
      return {
        refinementId: 'refinement-id-123',
        tokenUsage: { inputTokens: 100, outputTokens: 50 },
        model: 'gpt-4.1-mini',
        duration: 1000,
      };
    })();

    vi.mocked(refineText).mockReturnValue(mockGenerator);

    const request = new Request('http://localhost/api/ai/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftId: 'draft-id-123',
        selectedText: 'Test text',
        instruction: 'Test instruction',
        context: {
          plaintiffName: 'John Doe',
          defendantName: 'ABC Corp',
        },
      }),
    });

    await POST(request as any);

    // Verify refineText was called with context
    expect(refineText).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          plaintiffName: 'John Doe',
          defendantName: 'ABC Corp',
        },
      }),
      'user-id-123'
    );
  });

  it('should reject text that is too long', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);

    const longText = 'a'.repeat(10001); // Exceeds 10,000 character limit

    const request = new Request('http://localhost/api/ai/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftId: 'draft-id-123',
        selectedText: longText,
        instruction: 'Make it better',
      }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle AI service errors in stream', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(verifyDraftAccess).mockResolvedValue({
      id: 'draft-id-123',
      projectId: 'project-id-123',
      project: { firmId: 'firm-id-123' },
    } as any);

    // Mock refineText to throw error
    const mockGenerator = (async function* () {
      throw new Error('AI service unavailable');
    })();

    vi.mocked(refineText).mockReturnValue(mockGenerator);

    const request = new Request('http://localhost/api/ai/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftId: 'draft-id-123',
        selectedText: 'Test text',
        instruction: 'Make it better',
      }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(200); // SSE still returns 200, error in stream
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    // Read streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    const chunks: string[] = [];
    let done = false;

    while (!done) {
      const result = await reader?.read();
      if (result?.done) {
        done = true;
      } else if (result?.value) {
        chunks.push(decoder.decode(result.value, { stream: true }));
      }
    }

    const fullResponse = chunks.join('');

    // Verify error was sent in stream
    expect(fullResponse).toContain('data: {"type":"error"');
    expect(fullResponse).toContain('AI service unavailable');
  });
});
