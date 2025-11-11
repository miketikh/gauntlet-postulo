/**
 * Authentication Service
 * Handles password hashing, JWT generation, and token verification
 * Based on architecture.md security requirements
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';

// JWT configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';

// Token expiry times (following architecture.md)
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

// bcrypt cost factor (following architecture.md)
const BCRYPT_ROUNDS = 10;

/**
 * JWT Payload structure (following architecture.md)
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'attorney' | 'paralegal';
  firmId: string;
}

/**
 * Hash a password using bcrypt with cost factor 10
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate an access token (15 minute expiry)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'steno-api',
    audience: 'steno-client',
  });
}

/**
 * Generate a refresh token (7 day expiry)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'steno-api',
    audience: 'steno-client',
  });
}

/**
 * Verify and decode an access token
 * Throws UnauthorizedError if invalid
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'steno-api',
      audience: 'steno-client',
    });

    // Ensure the decoded token has the expected structure
    if (typeof decoded === 'object' && decoded !== null) {
      const payload = decoded as any;

      if (!payload.userId || !payload.email || !payload.role || !payload.firmId) {
        throw new UnauthorizedError('Invalid token payload');
      }

      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        firmId: payload.firmId,
      };
    }

    throw new UnauthorizedError('Invalid token format');
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    throw error;
  }
}

/**
 * Verify and decode a refresh token
 * Throws UnauthorizedError if invalid
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'steno-api',
      audience: 'steno-client',
    });

    // Ensure the decoded token has the expected structure
    if (typeof decoded === 'object' && decoded !== null) {
      const payload = decoded as any;

      if (!payload.userId || !payload.email || !payload.role || !payload.firmId) {
        throw new UnauthorizedError('Invalid refresh token payload');
      }

      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        firmId: payload.firmId,
      };
    }

    throw new UnauthorizedError('Invalid refresh token format');
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
