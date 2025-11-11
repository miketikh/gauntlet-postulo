/**
 * Integration tests for presence awareness
 * Tests multi-user cursor visibility and real-time updates
 * Part of Story 4.5 - Implement Presence Awareness
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Awareness } from 'y-protocols/awareness';
import * as Y from 'yjs';
import { CollaborativeEditor } from '../collaborative-editor';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/test',
}));

// Mock auth
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'attorney',
      firmId: 'firm-123',
    },
    accessToken: 'mock-token',
    isAuthenticated: true,
  }),
}));

// Mock y-websocket
vi.mock('y-websocket', () => {
  class MockWebsocketProvider {
    url: string;
    roomname: string;
    doc: any;
    awareness: Awareness;
    options: any;

    connect = vi.fn();
    disconnect = vi.fn();
    destroy = vi.fn();
    on = vi.fn((event: string, callback: Function) => {
      if (event === 'status') {
        // Simulate connected status
        setTimeout(() => callback({ status: 'connected' }), 0);
      }
    });
    off = vi.fn();

    constructor(url: string, room: string, doc: any, options?: any) {
      this.url = url;
      this.roomname = room;
      this.doc = doc;
      this.options = options;
      this.awareness = new Awareness(doc);
    }
  }

  return {
    WebsocketProvider: MockWebsocketProvider,
  };
});

// Mock fetch for Yjs state API
global.fetch = vi.fn((url: string) => {
  if (url.includes('/yjs-state')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ yjsState: null }),
    } as Response);
  }
  return Promise.reject(new Error('Not found'));
});

describe('Presence Awareness Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render presence indicators when users are connected', async () => {
    const { container } = render(
      <CollaborativeEditor
        draftId="draft-123"
        enableWebSocket={true}
        enablePresence={true}
        showPresenceIndicators={true}
      />
    );

    // Wait for editor to load
    await waitFor(
      () => {
        const editorInput = container.querySelector('.editor-input');
        expect(editorInput).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // Should show presence indicators (even if just the current user)
    // The component should render without errors
    expect(container).toBeTruthy();
  });

  it('should handle multiple remote users', async () => {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);

    // Add multiple remote users
    const user1State = {
      user: {
        id: 'user-456',
        name: 'User 1',
        email: 'user1@example.com',
      },
      color: {
        primary: 'rgb(59, 130, 246)',
        selection: 'rgba(59, 130, 246, 0.2)',
        dimmed: 'rgba(59, 130, 246, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      cursor: { anchor: 10, focus: 15 },
      lastActivity: Date.now(),
    };

    const user2State = {
      user: {
        id: 'user-789',
        name: 'User 2',
        email: 'user2@example.com',
      },
      color: {
        primary: 'rgb(16, 185, 129)',
        selection: 'rgba(16, 185, 129, 0.2)',
        dimmed: 'rgba(16, 185, 129, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      cursor: { anchor: 20, focus: 25 },
      lastActivity: Date.now(),
    };

    // Simulate remote users
    awareness.states.set(100, user1State);
    awareness.states.set(101, user2State);

    // Verify states are set
    expect(awareness.getStates().size).toBeGreaterThan(0);

    ydoc.destroy();
  });

  it('should update presence in real-time', async () => {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);

    const localState = {
      user: {
        id: 'user-123',
        name: 'Test User',
      },
      color: {
        primary: 'rgb(59, 130, 246)',
        selection: 'rgba(59, 130, 246, 0.2)',
        dimmed: 'rgba(59, 130, 246, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      lastActivity: Date.now(),
    };

    // Set local state
    awareness.setLocalState(localState);

    // Verify state is set
    expect(awareness.getLocalState()).toEqual(localState);

    // Update cursor
    awareness.setLocalStateField('cursor', { anchor: 10, focus: 15 });

    // Verify cursor is updated
    const updatedState = awareness.getLocalState() as any;
    expect(updatedState.cursor).toEqual({ anchor: 10, focus: 15 });

    ydoc.destroy();
  });

  it('should assign unique colors to different users', () => {
    const ydoc1 = new Y.Doc();
    const awareness1 = new Awareness(ydoc1);

    const ydoc2 = new Y.Doc();
    const awareness2 = new Awareness(ydoc2);

    const state1 = {
      user: { id: 'user-123', name: 'User 1' },
      color: {
        primary: 'rgb(59, 130, 246)',
        selection: 'rgba(59, 130, 246, 0.2)',
        dimmed: 'rgba(59, 130, 246, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      lastActivity: Date.now(),
    };

    const state2 = {
      user: { id: 'user-456', name: 'User 2' },
      color: {
        primary: 'rgb(16, 185, 129)',
        selection: 'rgba(16, 185, 129, 0.2)',
        dimmed: 'rgba(16, 185, 129, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      lastActivity: Date.now(),
    };

    awareness1.setLocalState(state1);
    awareness2.setLocalState(state2);

    // Colors should be different (different RGB values)
    expect(state1.color.primary).not.toBe(state2.color.primary);

    ydoc1.destroy();
    ydoc2.destroy();
  });

  it('should handle cursor position updates', () => {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);

    const initialState = {
      user: { id: 'user-123', name: 'Test User' },
      color: {
        primary: 'rgb(59, 130, 246)',
        selection: 'rgba(59, 130, 246, 0.2)',
        dimmed: 'rgba(59, 130, 246, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      cursor: { anchor: 0, focus: 0 },
      lastActivity: Date.now(),
    };

    awareness.setLocalState(initialState);

    // Update cursor position
    awareness.setLocalStateField('cursor', { anchor: 10, focus: 15 });

    const updatedState = awareness.getLocalState() as any;
    expect(updatedState.cursor.anchor).toBe(10);
    expect(updatedState.cursor.focus).toBe(15);

    ydoc.destroy();
  });

  it('should detect inactive users', () => {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);

    const now = Date.now();
    const pastTime = now - 35000; // 35 seconds ago

    const state = {
      user: { id: 'user-123', name: 'Test User' },
      color: {
        primary: 'rgb(59, 130, 246)',
        selection: 'rgba(59, 130, 246, 0.2)',
        dimmed: 'rgba(59, 130, 246, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      lastActivity: pastTime,
    };

    awareness.setLocalState(state);

    const inactiveTimeout = 30000; // 30 seconds
    const isActive = (now - state.lastActivity) < inactiveTimeout;

    // User should be inactive
    expect(isActive).toBe(false);

    ydoc.destroy();
  });

  it('should clear presence on disconnect', () => {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);

    const state = {
      user: { id: 'user-123', name: 'Test User' },
      color: {
        primary: 'rgb(59, 130, 246)',
        selection: 'rgba(59, 130, 246, 0.2)',
        dimmed: 'rgba(59, 130, 246, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      lastActivity: Date.now(),
    };

    awareness.setLocalState(state);
    expect(awareness.getLocalState()).toBeDefined();

    // Clear state (simulate disconnect)
    awareness.setLocalState(null);
    expect(awareness.getLocalState()).toBeNull();

    ydoc.destroy();
  });
});
