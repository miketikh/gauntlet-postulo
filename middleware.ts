/**
 * Next.js Middleware
 * Route protection for authentication
 * Based on architecture.md security patterns
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define protected routes (require authentication)
const protectedRoutes = ['/dashboard'];

// Define auth routes (redirect to dashboard if already authenticated)
const authRoutes = ['/login', '/signup'];

// Public routes that don't require authentication
const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/firms'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public API routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token in cookie or would be in localStorage (client-side only)
  // For SSR middleware, we'll use a cookie-based approach
  const token = request.cookies.get('accessToken')?.value;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // If token exists, verify it
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      );

      await jwtVerify(token, secret);

      // If user is authenticated and trying to access auth routes, redirect to dashboard
      if (isAuthRoute) {
        const url = new URL('/dashboard', request.url);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // Token is invalid or expired
      console.error('Invalid token in middleware:', error);

      // Clear invalid token
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('accessToken');

      // Only redirect to login if trying to access protected route
      if (isProtectedRoute) {
        return response;
      }
    }
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
