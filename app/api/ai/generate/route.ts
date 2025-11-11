/**
 * AI Generation Endpoint
 * POST /api/ai/generate - Generate demand letter with streaming
 * Based on architecture.md API patterns and SSE streaming
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { db } from '@/lib/db/client';
import { projects, templates, drafts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateDemandLetter } from '@/lib/services/ai.service';
import { NotFoundError, createErrorResponse, ValidationError } from '@/lib/errors';
import { z } from 'zod';

/**
 * Request body validation schema
 */
const generateRequestSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  templateId: z.string().uuid('Invalid template ID'),
  variables: z.record(z.string(), z.any()),
});

/**
 * POST /api/ai/generate
 *
 * Generates a demand letter using Claude API with streaming response.
 * Returns Server-Sent Events (SSE) with real-time text chunks.
 *
 * Request body:
 * {
 *   "projectId": "uuid",
 *   "templateId": "uuid",
 *   "variables": {
 *     "plaintiffName": "John Doe",
 *     "defendantName": "ABC Corp",
 *     ...
 *   }
 * }
 *
 * Response format (SSE):
 * data: {"type":"content","text":"chunk of text"}\n\n
 * data: {"type":"done","metadata":{"tokenUsage":{...},"model":"...","duration":1234}}\n\n
 * data: {"type":"error","error":"error message"}\n\n
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Authenticate user
    const user = await requireAuth(req);

    // Parse and validate request body
    const body = await req.json();
    const validationResult = generateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Invalid request body', validationResult.error.issues);
    }

    const { projectId, templateId, variables } = validationResult.data;

    // Verify project belongs to user's firm
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.firmId, user.firmId)
      ),
      with: {
        sourceDocuments: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get template
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, templateId),
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    // Combine source document text
    const sourceText = project.sourceDocuments
      .map(doc => doc.extractedText || '')
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!sourceText) {
      throw new ValidationError('No source documents with extracted text found');
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';
          let metadata: any = null;

          // Generate demand letter with streaming
          const generator = generateDemandLetter(sourceText, template, variables);

          for await (const chunk of generator) {
            if (typeof chunk === 'string') {
              // Stream text content
              fullContent += chunk;
              const data = `data: ${JSON.stringify({ type: 'content', text: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } else {
              // Generation complete - metadata received
              metadata = chunk;
            }
          }

          // Send completion metadata
          const doneData = `data: ${JSON.stringify({ type: 'done', metadata })}\n\n`;
          controller.enqueue(encoder.encode(doneData));

          // Save draft to database
          try {
            // Check if draft already exists for this project
            const existingDraft = await db.query.drafts.findFirst({
              where: eq(drafts.projectId, projectId),
            });

            if (existingDraft) {
              // Update existing draft
              await db
                .update(drafts)
                .set({
                  content: { text: fullContent },
                  plainText: fullContent,
                  currentVersion: existingDraft.currentVersion + 1,
                  updatedAt: new Date(),
                })
                .where(eq(drafts.id, existingDraft.id));
            } else {
              // Create new draft
              await db.insert(drafts).values({
                projectId,
                content: { text: fullContent },
                plainText: fullContent,
                currentVersion: 1,
              });
            }
          } catch (dbError) {
            console.error('Failed to save draft to database:', dbError);
            // Don't fail the entire request if DB save fails
            // The content was still generated and streamed to the client
          }

          controller.close();
        } catch (error) {
          console.error('AI generation error:', error);

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
    console.error('AI generation error:', error);

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
