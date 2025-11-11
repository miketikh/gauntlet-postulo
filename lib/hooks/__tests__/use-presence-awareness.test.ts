/**
 * Unit tests for usePresenceAwareness hook
 * Part of Story 4.5 - Implement Presence Awareness
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Awareness } from 'y-protocols/awareness';
import * as Y from 'yjs';
import { usePresenceAwareness, PresenceState, throttle } from '../use-presence-awareness';

// Mock WebSocket provider
const createMockProvider = (awareness: Awareness) => ({
  awareness,
  on: vi.fn(),
  off: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  destroy: vi.fn(),
});

describe('usePresenceAwareness', () => {
  let ydoc: Y.Doc;
  let awareness: Awareness;
  let mockProvider: any;
  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
  };

  beforeEach(() => {
    ydoc = new Y.Doc();
    awareness = new Awareness(ydoc);
    mockProvider = createMockProvider(awareness);
    vi.clearAllMocks();
  });

  afterEach(() => {
    ydoc.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with null awareness when provider is null', () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: null,
          user: mockUser,
          enabled: true,
        })
      );

      expect(result.current.awareness).toBeNull();
      expect(result.current.remoteUsers).toEqual([]);
      expect(result.current.clientId).toBeNull();
    });

    it('should initialize awareness when provider is available', () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      expect(result.current.awareness).toBe(awareness);
      expect(result.current.clientId).toBe(awareness.clientID);
    });

    it('should not initialize when enabled is false', () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: false,
        })
      );

      expect(result.current.awareness).toBeNull();
    });

    it('should set local state with user info and color on initialization', () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      const localState = awareness.getLocalState() as PresenceState;

      expect(localState).toBeDefined();
      expect(localState.user.id).toBe(mockUser.id);
      expect(localState.user.name).toBe(mockUser.name);
      expect(localState.user.email).toBe(mockUser.email);
      expect(localState.color).toBeDefined();
      expect(localState.color.primary).toBeDefined();
      expect(localState.color.selection).toBeDefined();
      expect(localState.lastActivity).toBeDefined();
    });
  });

  describe('Presence State', () => {
    it('should have correct presence data structure', () => {
      renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      const localState = awareness.getLocalState() as PresenceState;

      // Verify presence state structure
      expect(localState).toHaveProperty('user');
      expect(localState).toHaveProperty('color');
      expect(localState).toHaveProperty('lastActivity');

      // Verify user structure
      expect(localState.user).toHaveProperty('id');
      expect(localState.user).toHaveProperty('name');
      expect(localState.user).toHaveProperty('email');

      // Verify color structure
      expect(localState.color).toHaveProperty('primary');
      expect(localState.color).toHaveProperty('selection');
      expect(localState.color).toHaveProperty('dimmed');
      expect(localState.color).toHaveProperty('text');

      // Verify color values are valid CSS colors
      expect(localState.color.primary).toMatch(/^rgb\(/);
      expect(localState.color.selection).toMatch(/^rgba\(/);
    });

    it('should assign consistent colors based on user ID', () => {
      const { result: result1 } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      const state1 = result1.current.localState;

      // Create new awareness instance for second user
      const ydoc2 = new Y.Doc();
      const awareness2 = new Awareness(ydoc2);
      const mockProvider2 = createMockProvider(awareness2);

      const { result: result2 } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider2,
          user: mockUser, // Same user
          enabled: true,
        })
      );

      const state2 = result2.current.localState;

      // Same user should get same color
      expect(state1?.color.primary).toBe(state2?.color.primary);

      ydoc2.destroy();
    });
  });

  describe('Cursor Updates', () => {
    it('should update cursor position', () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      const cursor = { anchor: 10, focus: 20 };

      act(() => {
        result.current.updateCursor(cursor);
      });

      const localState = awareness.getLocalState() as PresenceState;
      expect(localState.cursor).toEqual(cursor);
    });

    it('should clear cursor when null is passed', () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      // Set cursor first
      act(() => {
        result.current.updateCursor({ anchor: 10, focus: 20 });
      });

      // Clear cursor
      act(() => {
        result.current.updateCursor(null);
      });

      const localState = awareness.getLocalState() as PresenceState;
      expect(localState.cursor).toBeUndefined();
    });

    it('should update lastActivity when cursor changes', () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      const initialState = awareness.getLocalState() as PresenceState;
      const initialActivity = initialState.lastActivity;

      // Wait a bit
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      act(() => {
        result.current.updateCursor({ anchor: 10, focus: 20 });
      });

      const updatedState = awareness.getLocalState() as PresenceState;
      expect(updatedState.lastActivity).toBeGreaterThan(initialActivity);

      vi.useRealTimers();
    });
  });

  describe('Activity Tracking', () => {
    it('should update activity timestamp', () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      const initialState = awareness.getLocalState() as PresenceState;
      const initialActivity = initialState.lastActivity;

      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.updateActivity();
      });

      const updatedState = awareness.getLocalState() as PresenceState;
      expect(updatedState.lastActivity).toBeGreaterThan(initialActivity);

      vi.useRealTimers();
    });
  });

  describe('Remote Users', () => {
    it('should track remote users from awareness', async () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      // Simulate remote user connecting
      const remoteClientId = 999;
      const remoteState: PresenceState = {
        user: {
          id: 'user-456',
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
        color: {
          primary: 'rgb(255, 0, 0)',
          selection: 'rgba(255, 0, 0, 0.2)',
          dimmed: 'rgba(255, 0, 0, 0.4)',
          text: 'rgb(255, 255, 255)',
        },
        cursor: { anchor: 5, focus: 10 },
        lastActivity: Date.now(),
      };

      awareness.setLocalStateField = vi.fn();

      // Manually set remote state (simulating network update)
      act(() => {
        awareness.states.set(remoteClientId, remoteState);
        awareness.emit('change', [
          { added: [remoteClientId], updated: [], removed: [] },
          'local',
        ]);
      });

      // Wait for state update
      await waitFor(() => {
        expect(result.current.remoteUsers.length).toBe(1);
      });

      const remoteUser = result.current.remoteUsers[0];
      expect(remoteUser.clientId).toBe(remoteClientId);
      expect(remoteUser.state.user.name).toBe('Jane Smith');
      expect(remoteUser.isActive).toBe(true);
    });

    it('should mark users as inactive after timeout', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
          inactiveTimeout: 30000, // 30 seconds
        })
      );

      // Add remote user with timestamp in the past
      const remoteClientId = 999;
      const now = Date.now();
      const remoteState: PresenceState = {
        user: {
          id: 'user-456',
          name: 'Jane Smith',
        },
        color: {
          primary: 'rgb(255, 0, 0)',
          selection: 'rgba(255, 0, 0, 0.2)',
          dimmed: 'rgba(255, 0, 0, 0.4)',
          text: 'rgb(255, 255, 255)',
        },
        lastActivity: now,
      };

      act(() => {
        awareness.states.set(remoteClientId, remoteState);
        awareness.emit('change', [
          { added: [remoteClientId], updated: [], removed: [] },
          'local',
        ]);
      });

      // User should be active initially
      expect(result.current.remoteUsers[0]?.isActive).toBe(true);

      // Advance time past inactive timeout
      act(() => {
        vi.advanceTimersByTime(35000); // 35 seconds - triggers the inactive check interval
      });

      // User should now be inactive (check happens every 5 seconds)
      expect(result.current.remoteUsers[0]?.isActive).toBe(false);

      vi.useRealTimers();
    });

    it('should not include local user in remote users list', async () => {
      const { result } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      // Local user should not be in remote users
      expect(result.current.remoteUsers).toEqual([]);

      // Verify local client ID is set
      expect(result.current.clientId).toBe(awareness.clientID);
    });
  });

  describe('Cleanup', () => {
    it('should clear local state on unmount', () => {
      const { unmount } = renderHook(() =>
        usePresenceAwareness({
          provider: mockProvider,
          user: mockUser,
          enabled: true,
        })
      );

      // Verify state is set
      expect(awareness.getLocalState()).toBeDefined();

      // Unmount
      unmount();

      // State should be cleared
      expect(awareness.getLocalState()).toBeNull();
    });
  });
});

describe('throttle utility', () => {
  it('should throttle function calls', () => {
    vi.useFakeTimers();

    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 150);

    // Call multiple times rapidly
    throttledFn('call1');
    throttledFn('call2');
    throttledFn('call3');

    // Should only execute once immediately
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call1');

    // Advance time past throttle delay
    vi.advanceTimersByTime(150);

    // Should execute with last arguments
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('call3');

    vi.useRealTimers();
  });

  it('should use custom delay', () => {
    vi.useFakeTimers();

    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 200);

    throttledFn('call1');
    throttledFn('call2');

    expect(mockFn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100); // Less than delay
    expect(mockFn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100); // Total 200ms
    expect(mockFn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
