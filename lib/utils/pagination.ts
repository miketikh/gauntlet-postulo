/**
 * Pagination Utilities for Story 6.3
 *
 * Provides type-safe pagination helpers for all list endpoints.
 * Implements consistent pagination pattern across the application.
 */

import { NextRequest } from 'next/server';

/**
 * Pagination parameters from query string
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Default pagination constants
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Extract and validate pagination parameters from request
 *
 * @param request - Next.js request object
 * @returns Validated pagination parameters with offset calculated
 *
 * @example
 * const { page, limit, offset } = getPaginationParams(request);
 * const projects = await db.select().from(projects).limit(limit).offset(offset);
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams;

  // Parse and validate page
  let page = parseInt(searchParams.get('page') || String(PAGINATION_DEFAULTS.DEFAULT_PAGE));
  if (isNaN(page) || page < 1) {
    page = PAGINATION_DEFAULTS.DEFAULT_PAGE;
  }

  // Parse and validate limit
  let limit = parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULTS.DEFAULT_LIMIT));
  if (isNaN(limit) || limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
    limit = PAGINATION_DEFAULTS.DEFAULT_LIMIT;
  }
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    limit = PAGINATION_DEFAULTS.MAX_LIMIT;
  }

  // Calculate offset
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create paginated response from items and total count
 *
 * @param items - Array of items for current page
 * @param totalItems - Total count of items across all pages
 * @param params - Pagination parameters used for query
 * @returns Formatted paginated response
 *
 * @example
 * const totalCount = await db.select({ count: count() }).from(projects);
 * const projects = await db.select().from(projects).limit(limit).offset(offset);
 * return createPaginatedResponse(projects, totalCount[0].count, { page, limit });
 */
export function createPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  params: Pick<PaginationParams, 'page' | 'limit'>
): PaginatedResponse<T> {
  const { page, limit } = params;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Build pagination metadata from count query result
 *
 * @param count - Total count from database
 * @param params - Pagination parameters
 * @returns Pagination metadata only (without items)
 */
export function buildPaginationMeta(
  count: number,
  params: Pick<PaginationParams, 'page' | 'limit'>
) {
  const { page, limit } = params;
  const totalPages = Math.ceil(count / limit);

  return {
    page,
    limit,
    totalPages,
    totalItems: count,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Validate and parse optional sorting parameters
 *
 * @param request - Next.js request object
 * @param allowedFields - Array of allowed field names for sorting
 * @returns Validated sort field and direction, or defaults
 *
 * @example
 * const { sortBy, sortOrder } = getSortParams(request, ['createdAt', 'title', 'status']);
 * // Use with Drizzle: .orderBy(sortOrder === 'asc' ? asc(projects[sortBy]) : desc(projects[sortBy]))
 */
export function getSortParams<T extends string>(
  request: NextRequest,
  allowedFields: readonly T[],
  defaultField: T = allowedFields[0],
  defaultOrder: 'asc' | 'desc' = 'desc'
): { sortBy: T; sortOrder: 'asc' | 'desc' } {
  const searchParams = request.nextUrl.searchParams;

  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');

  // Validate sortBy
  const validatedSortBy = sortBy && allowedFields.includes(sortBy as T)
    ? (sortBy as T)
    : defaultField;

  // Validate sortOrder
  const validatedSortOrder = sortOrder === 'asc' || sortOrder === 'desc'
    ? sortOrder
    : defaultOrder;

  return {
    sortBy: validatedSortBy,
    sortOrder: validatedSortOrder,
  };
}

/**
 * Type-safe pagination example for reference
 *
 * @example API Route Usage
 * ```typescript
 * import { getPaginationParams, createPaginatedResponse } from '@/lib/utils/pagination';
 * import { db } from '@/lib/db/client';
 * import { projects } from '@/lib/db/schema';
 * import { count, eq } from 'drizzle-orm';
 *
 * export async function GET(request: NextRequest) {
 *   const user = await requireAuth(request);
 *   const { page, limit, offset } = getPaginationParams(request);
 *
 *   // Get total count
 *   const [{ count: totalItems }] = await db
 *     .select({ count: count() })
 *     .from(projects)
 *     .where(eq(projects.firmId, user.firmId));
 *
 *   // Get paginated items
 *   const items = await db
 *     .select()
 *     .from(projects)
 *     .where(eq(projects.firmId, user.firmId))
 *     .limit(limit)
 *     .offset(offset)
 *     .orderBy(desc(projects.createdAt));
 *
 *   return NextResponse.json(
 *     createPaginatedResponse(items, totalItems, { page, limit })
 *   );
 * }
 * ```
 */
export type PaginationExample = never;
