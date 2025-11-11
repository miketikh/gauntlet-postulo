/**
 * Unit tests for useWebSocketProvider hook
 * Part of Story 4.4 - Implement Frontend WebSocket Client with y-websocket
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';

// Mock y-websocket module
vi.mock('y-websocket', () => {
  // Create mock class inside the factory
  class MockWebsocketProvider {
    url: string;
    roomname: string;
    doc: any;
    options: any;

    connect = vi.fn();
    disconnect = vi.fn();
    destroy = vi.fn();
    on = vi.fn();
    off = vi.fn();

    constructor(url: string, room: string, doc: any, options?: any) {
      this.url = url;
      this.roomname = room;
      this.doc = doc;
      this.options = options;
    }
  }

  return {
    WebsocketProvider: MockWebsocketProvider,
  };
});

// Import after mocking
import { useWebSocketProvider } from '../use-websocket-provider';

describe('useWebSocketProvider', () => {
  let ydoc: Y.Doc;
  const mockToken = 'mock-jwt-token';
  const mockDraftId = 'draft-123';

  beforeEach(() => {
    ydoc = new Y.Doc();
    vi.clearAllMocks();
  });

  afterEach(() => {
    ydoc.destroy();
  });

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        enabled: false, // Disabled to prevent connection
      })
    );

    expect(result.current.status).toBe('disconnected');
    expect(result.current.isDisconnected).toBe(true);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
  });

  it('should create WebSocket provider when enabled', async () => {
    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.provider).not.toBeNull();
      expect(result.current.status).toBe('connecting');
    });
  });

  it('should use custom WebSocket URL when provided', async () => {
    const customUrl = 'wss://custom-domain.com';

    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        wsUrl: customUrl,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.provider).not.toBeNull();
      expect(result.current.provider?.url).toBe(customUrl);
    });
  });

  it('should convert http URL to ws URL', async () => {
    const httpUrl = 'http://localhost:3000';

    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        wsUrl: httpUrl,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.provider).not.toBeNull();
      expect(result.current.provider?.url).toBe('ws://localhost:3000');
    });
  });

  it('should not create provider when enabled is false', () => {
    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        enabled: false,
      })
    );

    expect(result.current.provider).toBeNull();
  });

  it('should expose reconnect function', () => {
    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        enabled: false,
      })
    );

    expect(typeof result.current.reconnect).toBe('function');
  });

  it('should expose disconnect function', () => {
    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        enabled: false,
      })
    );

    expect(typeof result.current.disconnect).toBe('function');
  });

  it('should call onStatusChange callback when status changes', async () => {
    const onStatusChange = vi.fn();

    renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        enabled: true,
        onStatusChange,
      })
    );

    // Initial status should be 'connecting'
    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('connecting');
    });
  });

  it('should cleanup provider on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        enabled: true,
      })
    );

    let provider: any;
    await waitFor(() => {
      provider = result.current.provider;
      expect(provider).not.toBeNull();
    });

    unmount();

    expect(provider?.destroy).toHaveBeenCalled();
  });

  it('should provide provider instance', async () => {
    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: mockToken,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.provider).not.toBeNull();
    });
  });

  it('should handle missing token gracefully', () => {
    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: mockDraftId,
        ydoc,
        token: '',
        enabled: true,
      })
    );

    expect(result.current.status).toBe('disconnected');
  });

  it('should handle missing draftId gracefully', () => {
    const { result } = renderHook(() =>
      useWebSocketProvider({
        draftId: '',
        ydoc,
        token: mockToken,
        enabled: true,
      })
    );

    expect(result.current.status).toBe('disconnected');
  });
});
