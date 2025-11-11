/**
 * Authentication Layout
 * Centered card design with branding for login/signup pages
 * Based on architecture.md component patterns
 */

import { Scale } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Steno</h1>
            </div>
            <p className="text-slate-600 text-center">
              Demand Letter Generator
            </p>
          </div>

          {/* Auth Card Content */}
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-600">
        <p>
          &copy; {new Date().getFullYear()} Steno. All rights reserved.
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Link
            href="/privacy"
            className="hover:text-blue-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-blue-600 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
