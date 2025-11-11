/**
 * Authentication Store (Zustand)
 * Manages client-side authentication state
 * Based on architecture.md state management patterns
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'attorney' | 'paralegal';
  firmId: string;
}

const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const isBrowser = () => typeof document !== 'undefined';

const setAuthCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (!isBrowser()) return;
  const secureFlag =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAgeSeconds}; samesite=strict${secureFlag}`;
};

const clearAuthCookie = (name: string) => {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=strict`;
};

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}

/**
 * Auth store with localStorage persistence
 * Tokens are stored in localStorage (for POC - use httpOnly cookies in production)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Login action
      login: (user, accessToken, refreshToken) => {
        set(() => ({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }));

        if (accessToken) {
          setAuthCookie('accessToken', accessToken, ACCESS_TOKEN_MAX_AGE);
        }

        if (refreshToken) {
          setAuthCookie('refreshToken', refreshToken, REFRESH_TOKEN_MAX_AGE);
        }
      },

      // Logout action
      logout: () => {
        set(() => ({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }));

        clearAuthCookie('accessToken');
        clearAuthCookie('refreshToken');
      },

      // Update user
      setUser: (user) => {
        set({ user });
      },

      // Update access token (for refresh)
      setAccessToken: (token) => {
        set({ accessToken: token });
        if (token) {
          setAuthCookie('accessToken', token, ACCESS_TOKEN_MAX_AGE);
        } else {
          clearAuthCookie('accessToken');
        }
      },
    }),
    {
      name: 'steno-auth', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
