/**
 * AI Refinement Endpoint
 * POST /api/ai/refine - Refine selected text with streaming
 * Story 5.3 - Custom Prompt Refinement API
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { refineText, verifyDraftAccess } from '@/lib/services/refinement.service';
import { NotFoundError, createErrorResponse, ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Request body validation schema
 */
const refineRequestSchema = z.object({
  draftId: z.string().uuid('Invalid draft ID'),
  selectedText: z.string().min(1, 'Selected text is required').max(10000, 'Selected text too long (max 10,000 characters)'),
  instruction: z.string().min(1, 'Instruction is required').max(2000, 'Instruction too long (max 2,000 characters)'),
  quickActionId: z.string().optional(),
  context: z.object({
    plaintiffName: z.string().optional(),
    defendantName: z.string().optional(),
    caseDescription: z.string().optional(),
    documentType: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/ai/refine
 *
 * Refines selected text using AI with streaming response.
 * Returns Server-Sent Events (SSE) with real-time text chunks.
 *
 * Request body:
 * {
 *   "draftId": "uuid",
 *   "selectedText": "The text to refine...",
 *   "instruction": "Make more assertive",
 *   "quickActionId": "make-assertive" (optional),
 *   "context": {
 *     "plaintiffName": "John Doe",
 *     "defendantName": "ABC Corp"
 *   } (optional)
 * }
 *
 * Response format (SSE):
 * data: {"type":"content","text":"chunk of text"}\n\n
 * data: {"type":"done","metadata":{"refinementId":"uuid","tokenUsage":{...},"model":"...","duration":1234}}\n\n
 * data: {"type":"error","error":"error message"}\n\n
 *
 * Security:
 * - Requires authentication
 * - Verifies draft belongs to user's firm
 * - Rate limiting recommended (future enhancement)
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Authenticate user
    const user = await requireAuth(req);

    // Parse and validate request body
    const body = await req.json();
    const validationResult = refineRequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid request body', validationResult.error.issues);
    }

    const { draftId, selectedText, instruction, quickActionId, context } = validationResult.data;

    // Verify draft belongs to user's firm
    const draft = await verifyDraftAccess(draftId, user.firmId);

    if (!draft) {
      throw new NotFoundError('Draft not found or access denied');
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let metadata: any = null;

          // Refine text with streaming
          const generator = refineText(
            {
              draftId,
              selectedText,
              instruction,
              quickActionId,
              context,
            },
            user.userId
          );

          for await (const chunk of generator) {
            if (typeof chunk === 'string') {
              // Stream text content
              const data = `data: ${JSON.stringify({ type: 'content', text: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } else {
              // Refinement complete - metadata received
              metadata = chunk;
            }
          }

          // Send completion metadata
          const doneData = `data: ${JSON.stringify({ type: 'done', metadata })}\n\n`;
          controller.enqueue(encoder.encode(doneData));

          controller.close();
        } catch (error) {
          console.error('AI refinement error:', error);

          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          const errorData = `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('AI refinement error:', error);

    // For validation and auth errors, return standard JSON error response
    if (error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof Error) {
      const errorResponse = createErrorResponse(error);
      return Response.json(errorResponse, {
        status: (error as any).statusCode || 500,
      });
    }

    // Unknown error
    const errorResponse = createErrorResponse(new Error('Internal server error'));
    return Response.json(errorResponse, {
      status: 500,
    });
  }
}
