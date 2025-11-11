/**
 * Authentication Validation Schemas
 * Zod schemas for validating authentication endpoints
 * Based on architecture.md validation requirements
 */

import { z } from 'zod';

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

/**
 * User role validation
 */
const roleSchema = z.enum(['admin', 'attorney', 'paralegal'], {
  errorMap: () => ({ message: 'Role must be one of: admin, attorney, paralegal' }),
});

/**
 * Registration request validation
 * POST /api/auth/register
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),
  firmId: z
    .string()
    .uuid('Invalid firm ID format'),
  role: roleSchema.optional().default('paralegal'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login request validation
 * POST /api/auth/login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Refresh token request validation
 * POST /api/auth/refresh
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * User response schema (never includes password hash)
 */
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: roleSchema,
  firmId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

/**
 * Auth token response
 */
export const authTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userResponseSchema,
});

export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;
