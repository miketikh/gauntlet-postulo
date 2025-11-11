/**
 * Unit tests for offline editing features in useWebSocketProvider hook
 * Part of Story 4.9 - Implement Offline Editing with Sync on Reconnect
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';

// Mock y-websocket module
vi.mock('y-websocket', () => {
  class MockWebsocketProvider {
    url: string;
    roomname: string;
    doc: any;
    options: any;
    _syncTimeout: NodeJS.Timeout | null = null;
    _eventHandlers: Map<string, Array<(...args: any[]) => void>> = new Map();

    connect = vi.fn();
    disconnect = vi.fn();
    destroy = vi.fn();

    constructor(url: string, room: string, doc: any, options?: any) {
      this.url = url;
      this.roomname = room;
      this.doc = doc;
      this.options = options;
    }

    on(event: string, handler: (...args: any[]) => void) {
      if (!this._eventHandlers.has(event)) {
        this._eventHandlers.set(event, []);
      }
      this._eventHandlers.get(event)!.push(handler);
    }

    off(event: string, handler: (...args: any[]) => void) {
      const handlers = this._eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }

    // Helper to trigger events in tests
    _triggerEvent(event: string, ...args: any[]) {
      const handlers = this._eventHandlers.get(event);
      if (handlers) {
        handlers.forEach(handler => handler(...args));
      }
    }
  }

  return {
    WebsocketProvider: MockWebsocketProvider,
  };
});

// Import after mocking
import { useWebSocketProvider } from '../use-websocket-provider';

describe('useWebSocketProvider - Offline Editing', () => {
  let ydoc: Y.Doc;
  const mockToken = 'mock-jwt-token';
  const mockDraftId = 'draft-123';

  beforeEach(() => {
    ydoc = new Y.Doc();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    ydoc.destroy();
    vi.useRealTimers();
  });

  describe('Offline Duration Tracking', () => {
    it('should track offline duration when disconnected', async () => {
      const { result } = renderHook(() =>
        useWebSocketProvider({
          draftId: mockDraftId,
          ydoc,
          token: mockToken,
          enabled: true,
        })
      );

      // Wait for provider to initialize
      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(result.current.provider).not.toBeNull();

      // Initially should be 0
      expect(result.current.offlineDuration).toBe(0);

      // Simulate disconnection
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'disconnected' });
      });

      // Status should update immediately
      expect(result.current.status).toBe('disconnected');

      // Advance time by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should show approximately 5 seconds offline
      expect(result.current.offlineDuration).toBeGreaterThanOrEqual(4000);
      expect(result.current.offlineDuration).toBeLessThan(6000);

      // Advance time by another 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should show approximately 10 seconds offline
      expect(result.current.offlineDuration).toBeGreaterThanOrEqual(9000);
      expect(result.current.offlineDuration).toBeLessThan(11000);
    });

    it('should reset offline duration when reconnected', async () => {
      const { result } = renderHook(() =>
        useWebSocketProvider({
          draftId: mockDraftId,
          ydoc,
          token: mockToken,
          enabled: true,
        })
      );

      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(result.current.provider).not.toBeNull();

      // Simulate disconnection
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'disconnected' });
      });

      expect(result.current.status).toBe('disconnected');

      // Advance time
      act(() => {
        vi.advanceTimersByTime(30000); // 30 seconds
      });

      expect(result.current.offlineDuration).toBeGreaterThanOrEqual(29000);

      // Simulate reconnection
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'connected' });
      });

      // Offline duration should reset immediately
      expect(result.current.offlineDuration).toBe(0);
    });
  });

  describe('Long Offline Period Detection', () => {
    it('should detect when offline period exceeds 5 minutes', async () => {
      const { result } = renderHook(() =>
        useWebSocketProvider({
          draftId: mockDraftId,
          ydoc,
          token: mockToken,
          enabled: true,
        })
      );

      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(result.current.provider).not.toBeNull();

      // Initially not in long offline period
      expect(result.current.isLongOfflinePeriod).toBe(false);

      // Simulate disconnection
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'disconnected' });
      });

      expect(result.current.status).toBe('disconnected');

      // Advance time by 4 minutes - should not be long offline period yet
      act(() => {
        vi.advanceTimersByTime(4 * 60 * 1000);
      });

      expect(result.current.isLongOfflinePeriod).toBe(false);

      // Advance time past 5 minutes
      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000); // Total: 6 minutes
      });

      // Should now be in long offline period
      expect(result.current.isLongOfflinePeriod).toBe(true);
    });

    it('should clear long offline period flag when reconnected', async () => {
      const { result } = renderHook(() =>
        useWebSocketProvider({
          draftId: mockDraftId,
          ydoc,
          token: mockToken,
          enabled: true,
        })
      );

      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(result.current.provider).not.toBeNull();

      // Simulate disconnection
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'disconnected' });
      });

      expect(result.current.status).toBe('disconnected');

      // Advance time past 5 minutes
      act(() => {
        vi.advanceTimersByTime(6 * 60 * 1000);
      });

      expect(result.current.isLongOfflinePeriod).toBe(true);

      // Reconnect
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'connected' });
      });

      // Should no longer be in long offline period
      expect(result.current.isLongOfflinePeriod).toBe(false);
    });
  });

  describe('Syncing State', () => {
    it('should transition from connecting to syncing to connected', async () => {
      const { result } = renderHook(() =>
        useWebSocketProvider({
          draftId: mockDraftId,
          ydoc,
          token: mockToken,
          enabled: true,
        })
      );

      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(result.current.provider).not.toBeNull();

      // Should start in connecting state
      expect(result.current.status).toBe('connecting');

      // Simulate connection established
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'connected' });
      });

      // Should transition to syncing
      expect(result.current.status).toBe('syncing');
      expect(result.current.isSyncing).toBe(true);

      // Simulate sync complete
      act(() => {
        (result.current.provider as any)._triggerEvent('sync', true);
      });

      // Should transition to connected
      expect(result.current.status).toBe('connected');
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.isConnected).toBe(true);
    });

    it('should automatically transition to connected after sync timeout', async () => {
      const { result } = renderHook(() =>
        useWebSocketProvider({
          draftId: mockDraftId,
          ydoc,
          token: mockToken,
          enabled: true,
        })
      );

      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(result.current.provider).not.toBeNull();

      // Simulate connection established
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'connected' });
      });

      expect(result.current.status).toBe('syncing');

      // Advance time past sync timeout (2 seconds)
      act(() => {
        vi.advanceTimersByTime(2500);
      });

      // Should automatically transition to connected
      expect(result.current.status).toBe('connected');
    });
  });

  describe('Reconnection with Offline Changes', () => {
    it('should maintain offline duration during reconnection attempts', async () => {
      const { result } = renderHook(() =>
        useWebSocketProvider({
          draftId: mockDraftId,
          ydoc,
          token: mockToken,
          enabled: true,
        })
      );

      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(result.current.provider).not.toBeNull();

      // Simulate disconnection
      act(() => {
        (result.current.provider as any)._triggerEvent('status', { status: 'disconnected' });
      });

      expect(result.current.status).toBe('disconnected');

      // Advance time
      act(() => {
        vi.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.offlineDuration).toBeGreaterThanOrEqual(9000);

      // Trigger reconnection attempt (still disconnected)
      act(() => {
        vi.advanceTimersByTime(1000); // Trigger first reconnect after 1s backoff
      });

      // Should still track offline duration
      act(() => {
        vi.advanceTimersByTime(5000); // 5 more seconds
      });

      expect(result.current.offlineDuration).toBeGreaterThanOrEqual(15000);
    });
  });
});
