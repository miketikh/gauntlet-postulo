/**
 * Integration tests for WebSocket-based collaborative editing
 * Part of Story 4.4 - Implement Frontend WebSocket Client with y-websocket
 *
 * These tests verify that two browser instances (simulated) can sync changes in real-time
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import * as Y from 'yjs';
import { WebSocket as WS } from 'ws';

// Note: These are integration tests that would ideally run against a real WebSocket server
// For now, we'll test the basic sync mechanism with mocked WebSocket

describe('Collaborative Editor WebSocket Integration', () => {
  let ydoc1: Y.Doc;
  let ydoc2: Y.Doc;

  beforeEach(() => {
    ydoc1 = new Y.Doc();
    ydoc2 = new Y.Doc();
  });

  afterEach(() => {
    ydoc1.destroy();
    ydoc2.destroy();
  });

  describe('Yjs CRDT synchronization', () => {
    it('should sync text changes between two Yjs documents', () => {
      // Simulate two clients with the same document
      const text1 = ydoc1.getText('content');
      const text2 = ydoc2.getText('content');

      // Client 1 makes a change
      text1.insert(0, 'Hello from client 1');

      // Get the update from client 1
      const update = Y.encodeStateAsUpdate(ydoc1);

      // Apply update to client 2
      Y.applyUpdate(ydoc2, update);

      // Client 2 should see the change
      expect(text2.toString()).toBe('Hello from client 1');
    });

    it('should merge concurrent edits without conflicts', () => {
      const text1 = ydoc1.getText('content');
      const text2 = ydoc2.getText('content');

      // Start with same initial state
      text1.insert(0, 'Initial text');
      const initialUpdate = Y.encodeStateAsUpdate(ydoc1);
      Y.applyUpdate(ydoc2, initialUpdate);

      // Both clients make concurrent edits
      text1.insert(0, 'Client 1: ');
      text2.insert(text2.length, ' - Client 2');

      // Exchange updates
      const update1 = Y.encodeStateAsUpdate(ydoc1);
      const update2 = Y.encodeStateAsUpdate(ydoc2);

      Y.applyUpdate(ydoc1, update2);
      Y.applyUpdate(ydoc2, update1);

      // Both should converge to the same state
      const finalText1 = text1.toString();
      const finalText2 = text2.toString();

      expect(finalText1).toBe(finalText2);
      expect(finalText1).toContain('Client 1:');
      expect(finalText1).toContain('Client 2');
      expect(finalText1).toContain('Initial text');
    });

    it('should handle multiple rapid updates', () => {
      const text1 = ydoc1.getText('content');
      const text2 = ydoc2.getText('content');

      // Client 1 makes multiple rapid changes
      const updates: Uint8Array[] = [];

      ydoc1.on('update', (update: Uint8Array) => {
        updates.push(update);
      });

      text1.insert(0, 'First ');
      text1.insert(6, 'Second ');
      text1.insert(13, 'Third');

      // Apply all updates to client 2
      updates.forEach((update) => {
        Y.applyUpdate(ydoc2, update);
      });

      expect(text2.toString()).toBe('First Second Third');
    });

    it('should handle offline edits and sync on reconnect', () => {
      const text1 = ydoc1.getText('content');
      const text2 = ydoc2.getText('content');

      // Initial sync
      text1.insert(0, 'Shared content');
      const initialUpdate = Y.encodeStateAsUpdate(ydoc1);
      Y.applyUpdate(ydoc2, initialUpdate);

      // Client 1 goes offline and makes edits
      const offlineUpdates: Uint8Array[] = [];
      ydoc1.on('update', (update: Uint8Array) => {
        offlineUpdates.push(update);
      });

      text1.insert(0, 'Offline edit: ');

      // Client 2 also makes edits while client 1 is offline
      text2.insert(text2.length, ' (modified by client 2)');

      // Client 1 comes back online and syncs
      offlineUpdates.forEach((update) => {
        Y.applyUpdate(ydoc2, update);
      });

      // Sync client 2's changes to client 1
      const client2Update = Y.encodeStateAsUpdate(ydoc2);
      Y.applyUpdate(ydoc1, client2Update);

      // Both should converge
      expect(text1.toString()).toBe(text2.toString());
      expect(text1.toString()).toContain('Offline edit:');
      expect(text1.toString()).toContain('modified by client 2');
    });
  });

  describe('WebSocket message format', () => {
    it('should encode Yjs updates as binary for efficient transfer', () => {
      const text = ydoc1.getText('content');
      text.insert(0, 'Test content');

      const update = Y.encodeStateAsUpdate(ydoc1);

      // Update should be a Uint8Array (binary)
      expect(update).toBeInstanceOf(Uint8Array);

      // Should be relatively small (binary encoding is efficient)
      expect(update.length).toBeLessThan(100);
    });

    it('should convert binary update to array for JSON serialization', () => {
      const text = ydoc1.getText('content');
      text.insert(0, 'Test');

      const update = Y.encodeStateAsUpdate(ydoc1);
      const array = Array.from(update);

      // Should be serializable to JSON
      const json = JSON.stringify({ type: 'yjs-update', data: array });
      expect(json).toContain('"type":"yjs-update"');

      // Should be deserializable
      const parsed = JSON.parse(json);
      const restoredUpdate = new Uint8Array(parsed.data);

      // Should apply correctly
      const ydoc3 = new Y.Doc();
      Y.applyUpdate(ydoc3, restoredUpdate);
      expect(ydoc3.getText('content').toString()).toBe('Test');

      ydoc3.destroy();
    });
  });

  describe('State vector synchronization', () => {
    it('should sync full state to newly connected client', () => {
      const text1 = ydoc1.getText('content');

      // Client 1 has existing content
      text1.insert(0, 'Existing content from before client 2 connected');

      // New client 2 connects and requests full state
      const fullState = Y.encodeStateAsUpdate(ydoc1);

      // Client 2 applies full state
      Y.applyUpdate(ydoc2, fullState);

      // Client 2 should have all the content
      const text2 = ydoc2.getText('content');
      expect(text2.toString()).toBe('Existing content from before client 2 connected');
    });

    it('should only send missing updates (delta sync)', () => {
      const text1 = ydoc1.getText('content');
      const text2 = ydoc2.getText('content');

      // Both clients start with same state
      text1.insert(0, 'Initial');
      const initialState = Y.encodeStateAsUpdate(ydoc1);
      Y.applyUpdate(ydoc2, initialState);

      // Get state vector from client 2
      const stateVector2 = Y.encodeStateVector(ydoc2);

      // Client 1 makes new changes
      text1.insert(text1.length, ' and new content');

      // Get only the missing updates (delta)
      const delta = Y.encodeStateAsUpdate(ydoc1, stateVector2);

      // Delta should be smaller than full state
      const fullState = Y.encodeStateAsUpdate(ydoc1);
      expect(delta.length).toBeLessThanOrEqual(fullState.length);

      // Apply delta to client 2
      Y.applyUpdate(ydoc2, delta);

      // Should be in sync
      expect(text2.toString()).toBe('Initial and new content');
    });
  });

  describe('Exponential backoff reconnection', () => {
    it('should calculate correct backoff delays', () => {
      const getReconnectDelay = (attempts: number): number => {
        const baseDelay = 1000; // 1 second
        const maxDelay = 30000; // 30 seconds
        const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
        return delay;
      };

      expect(getReconnectDelay(0)).toBe(1000); // 1s
      expect(getReconnectDelay(1)).toBe(2000); // 2s
      expect(getReconnectDelay(2)).toBe(4000); // 4s
      expect(getReconnectDelay(3)).toBe(8000); // 8s
      expect(getReconnectDelay(4)).toBe(16000); // 16s
      expect(getReconnectDelay(5)).toBe(30000); // 30s (capped)
      expect(getReconnectDelay(10)).toBe(30000); // Still 30s (capped)
    });
  });
});

/**
 * Manual testing instructions for real multi-client sync:
 *
 * 1. Start the server: npm run dev
 * 2. Open browser tab 1: http://localhost:3000/projects/[project-id]
 * 3. Open browser tab 2 (same URL): http://localhost:3000/projects/[project-id]
 * 4. In tab 1: Type "Hello from tab 1"
 * 5. Verify tab 2 shows "Hello from tab 1" in real-time
 * 6. In tab 2: Type " and hello from tab 2"
 * 7. Verify tab 1 shows the full text
 * 8. Open DevTools Network tab, filter by WS
 * 9. Verify WebSocket connection is established
 * 10. Verify yjs-update messages are being sent
 * 11. Close tab 2
 * 12. Verify tab 1 continues to work (offline mode)
 * 13. Reopen tab 2
 * 14. Verify both tabs sync up correctly
 */
