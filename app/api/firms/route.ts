/**
 * GET /api/firms
 * Public endpoint to list all firms for signup form
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { firms } from '@/lib/db/schema';

export async function GET() {
  try {
    // Get all firms (public endpoint for signup)
    const allFirms = await db.select({
      id: firms.id,
      name: firms.name,
    }).from(firms);

    return NextResponse.json(
      {
        firms: allFirms,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching firms:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch firms',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
