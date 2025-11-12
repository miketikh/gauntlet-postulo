/**
 * usePresenceAwareness Hook
 * Manages Yjs awareness for presence indicators (cursors, selections, active users)
 * Part of Story 4.5 - Implement Presence Awareness
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Awareness } from 'y-protocols/awareness';
import { WebsocketProvider } from 'y-websocket';
import { getUserColor } from '@/lib/utils/presence-colors';

/**
 * User presence state shared via Yjs awareness
 */
export interface PresenceState {
  /**
   * User information
   */
  user: {
    id: string;
    name: string;
    email?: string;
  };

  /**
   * User's assigned color
   */
  color: {
    primary: string;
    selection: string;
    dimmed: string;
    text: string;
  };

  /**
   * Cursor position in the document (Lexical selection)
   */
  cursor?: {
    anchor: number;
    focus: number;
  };

  /**
   * Last activity timestamp (for inactive detection)
   */
  lastActivity: number;
}

/**
 * Remote user presence information
 */
export interface RemoteUser {
  /**
   * Client ID from Yjs awareness
   */
  clientId: number;

  /**
   * User presence state
   */
  state: PresenceState;

  /**
   * Whether user is currently active (activity within 30 seconds)
   */
  isActive: boolean;
}

export interface UsePresenceAwarenessOptions {
  /**
   * WebSocket provider instance
   */
  provider: WebsocketProvider | null;

  /**
   * Current user information
   */
  user: {
    id: string;
    name: string;
    email?: string;
  } | null;

  /**
   * Whether awareness is enabled
   */
  enabled?: boolean;

  /**
   * Callback when remote users change
   */
  onRemoteUsersChange?: (users: RemoteUser[]) => void;

  /**
   * Inactive timeout in milliseconds (default: 30000 = 30 seconds)
   */
  inactiveTimeout?: number;
}

export interface UsePresenceAwarenessReturn {
  /**
   * Awareness instance
   */
  awareness: Awareness | null;

  /**
   * List of remote users with presence information
   */
  remoteUsers: RemoteUser[];

  /**
   * Local user's client ID
   */
  clientId: number | null;

  /**
   * Update cursor position
   * This should be throttled by the caller (100-200ms)
   */
  updateCursor: (cursor: { anchor: number; focus: number } | null) => void;

  /**
   * Update last activity timestamp (call on any user interaction)
   */
  updateActivity: () => void;

  /**
   * Local presence state
   */
  localState: PresenceState | null;
}

/**
 * Hook to manage Yjs awareness for user presence
 *
 * Features:
 * 1. Broadcasts user presence data (ID, name, color, cursor, selection)
 * 2. Assigns unique color on connection
 * 3. Tracks remote users' presence state
 * 4. Detects inactive users (no activity for 30 seconds)
 * 5. Clears presence on disconnect
 * 6. Provides throttled cursor update function
 */
export function usePresenceAwareness({
  provider,
  user,
  enabled = true,
  onRemoteUsersChange,
  inactiveTimeout = 30000,
}: UsePresenceAwarenessOptions): UsePresenceAwarenessReturn {
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [localState, setLocalState] = useState<PresenceState | null>(null);

  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onRemoteUsersChangeRef = useRef(onRemoteUsersChange);

  // Update callback ref when it changes (without triggering other effects)
  useEffect(() => {
    onRemoteUsersChangeRef.current = onRemoteUsersChange;
  }, [onRemoteUsersChange]);

  /**
   * Initialize awareness when provider is available
   */
  useEffect(() => {
    if (!provider || !enabled || !user) {
      setAwareness(null);
      return;
    }

    const awarenessInstance = provider.awareness;
    setAwareness(awarenessInstance);
    setClientId(awarenessInstance.clientID);

    // Set initial local state
    const userColor = getUserColor(user.id);
    const initialState: PresenceState = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      color: userColor,
      lastActivity: Date.now(),
    };

    awarenessInstance.setLocalState(initialState);
    setLocalState(initialState);

    // Cleanup on unmount
    return () => {
      awarenessInstance.setLocalState(null);
    };
  }, [provider, enabled, user?.id, user?.name, user?.email]);

  /**
   * Listen for awareness changes and track remote users
   */
  useEffect(() => {
    if (!awareness) return;

    const updateRemoteUsers = () => {
      const states = awareness.getStates();
      const localClientId = awareness.clientID;
      const now = Date.now();

      const users: RemoteUser[] = [];

      states.forEach((state, id) => {
        // Skip local user
        if (id === localClientId) return;

        const presenceState = state as PresenceState;

        // Check if user is active (activity within timeout)
        const isActive = (now - presenceState.lastActivity) < inactiveTimeout;

        users.push({
          clientId: id,
          state: presenceState,
          isActive,
        });
      });

      setRemoteUsers(users);
      onRemoteUsersChangeRef.current?.(users);
    };

    // Listen for awareness changes
    awareness.on('change', updateRemoteUsers);

    // Set up interval to check for inactive users
    const inactiveCheckInterval = setInterval(updateRemoteUsers, 5000); // Check every 5 seconds

    // Initial update
    updateRemoteUsers();

    return () => {
      awareness.off('change', updateRemoteUsers);
      clearInterval(inactiveCheckInterval);
    };
  }, [awareness, inactiveTimeout]); // Removed onRemoteUsersChange - now called via ref

  /**
   * Update cursor position
   * Note: Caller should throttle this (100-200ms)
   */
  const updateCursor = useCallback(
    (cursor: { anchor: number; focus: number } | null) => {
      if (!awareness || !localState) return;

      const updatedState: PresenceState = {
        ...localState,
        cursor: cursor || undefined,
        lastActivity: Date.now(),
      };

      awareness.setLocalStateField('cursor', cursor || undefined);
      awareness.setLocalStateField('lastActivity', Date.now());
      setLocalState(updatedState);
    },
    [awareness, localState]
  );

  /**
   * Update last activity timestamp
   * Call this on any user interaction (typing, clicking, etc.)
   */
  const updateActivity = useCallback(() => {
    if (!awareness || !localState) return;

    const now = Date.now();
    awareness.setLocalStateField('lastActivity', now);
    setLocalState({
      ...localState,
      lastActivity: now,
    });
  }, [awareness, localState]);

  /**
   * Set up activity heartbeat to keep user marked as active
   */
  useEffect(() => {
    if (!awareness || !enabled) return;

    // Update activity every 10 seconds to prevent timeout
    const heartbeatInterval = setInterval(() => {
      updateActivity();
    }, 10000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [awareness, enabled, updateActivity]);

  return {
    awareness,
    remoteUsers,
    clientId,
    updateCursor,
    updateActivity,
    localState,
  };
}

/**
 * Throttle function for cursor updates
 * Use this to wrap cursor update calls to avoid flooding the network
 *
 * @param func - Function to throttle
 * @param delay - Throttle delay in milliseconds (default: 150ms)
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 150
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number = 0;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    lastArgs = args;

    // If enough time has passed since last call, execute immediately
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      func(...args);
      return;
    }

    // Otherwise, schedule execution after remaining time
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      lastCallTime = Date.now();
      if (lastArgs) {
        func(...lastArgs);
      }
    }, delay - (now - lastCallTime));
  };
}
