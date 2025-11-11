/**
 * Authentication Middleware
 * Handles JWT token extraction and verification for protected routes
 * Based on architecture.md authentication patterns
 */

import { NextRequest } from 'next/server';
import { extractTokenFromHeader, verifyAccessToken, JWTPayload } from '../services/auth.service';
import { UnauthorizedError } from '../errors';

/**
 * Authenticated user data returned by requireAuth
 */
export interface AuthenticatedUser extends JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'attorney' | 'paralegal';
  firmId: string;
}

/**
 * Require authentication for a route
 * Extracts and verifies JWT from Authorization header
 * Returns user data if valid, throws UnauthorizedError otherwise
 *
 * Usage in API routes:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const user = await requireAuth(req);
 *   // user contains: { userId, email, role, firmId }
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get('Authorization');

  // Extract token from header
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    throw new UnauthorizedError('Missing authentication token');
  }

  // Verify and decode token
  const payload = verifyAccessToken(token);

  return payload;
}

/**
 * Optional authentication - doesn't throw if no token present
 * Returns user data if valid token exists, null otherwise
 * Useful for routes that have different behavior for authenticated vs anonymous users
 */
export async function optionalAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);
    return payload;
  } catch (error) {
    // If token is invalid or expired, return null (don't throw)
    return null;
  }
}

/**
 * Require specific role(s) for a route
 * Must be used after requireAuth
 *
 * Usage:
 * ```typescript
 * export async function DELETE(req: NextRequest) {
 *   const user = await requireAuth(req);
 *   requireRole(user, ['admin', 'attorney']);
 *   // Only admins and attorneys can proceed
 * }
 * ```
 */
export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: Array<'admin' | 'attorney' | 'paralegal'>
): void {
  if (!allowedRoles.includes(user.role)) {
    throw new UnauthorizedError(`Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`);
  }
}
