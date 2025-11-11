/**
 * Draft API Routes
 * CRUD operations for demand letter drafts
 * Part of Story 4.1 - Integrate Rich Text Editor
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { drafts, projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * GET /api/drafts/[id]
 * Get draft by project ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify project belongs to user's firm
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.firmId, auth.firmId)
      ),
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Get draft
    const draft = await db.query.drafts.findFirst({
      where: eq(drafts.projectId, id),
    });

    if (!draft) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch draft' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/drafts/[id]
 * Update draft content
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify project belongs to user's firm
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.firmId, auth.firmId)
      ),
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Content is required' } },
        { status: 400 }
      );
    }

    // Check if draft exists
    const existingDraft = await db.query.drafts.findFirst({
      where: eq(drafts.projectId, id),
    });

    let draft;

    if (existingDraft) {
      // Update existing draft
      const [updatedDraft] = await db
        .update(drafts)
        .set({
          content: typeof content === 'string' ? JSON.parse(content) : content,
          updatedAt: new Date(),
        })
        .where(eq(drafts.id, existingDraft.id))
        .returning();

      draft = updatedDraft;
    } else {
      // Create new draft
      const [newDraft] = await db
        .insert(drafts)
        .values({
          projectId: id,
          content: typeof content === 'string' ? JSON.parse(content) : content,
        })
        .returning();

      draft = newDraft;
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update draft' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drafts/[id]
 * Create new draft
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify project belongs to user's firm
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.firmId, auth.firmId)
      ),
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content } = body;

    // Check if draft already exists
    const existingDraft = await db.query.drafts.findFirst({
      where: eq(drafts.projectId, id),
    });

    if (existingDraft) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Draft already exists' } },
        { status: 409 }
      );
    }

    // Create new draft
    const [newDraft] = await db
      .insert(drafts)
      .values({
        projectId: id,
        content: content ? (typeof content === 'string' ? JSON.parse(content) : content) : {},
      })
      .returning();

    return NextResponse.json({ draft: newDraft }, { status: 201 });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create draft' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drafts/[id]
 * Delete draft
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify project belongs to user's firm
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, id),
        eq(projects.firmId, auth.firmId)
      ),
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Delete draft
    await db.delete(drafts).where(eq(drafts.projectId, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete draft' } },
      { status: 500 }
    );
  }
}
