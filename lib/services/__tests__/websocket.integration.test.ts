/**
 * WebSocket Integration Tests
 * Integration tests for Yjs update broadcasting between multiple clients
 * Part of Story 4.3 - Implement WebSocket Server for Real-Time Sync
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { WebSocketManager } from '../websocket.service';
import { generateAccessToken } from '../auth.service';
import * as Y from 'yjs';

// Mock the logger to avoid console output during tests
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  logWsConnection: vi.fn(),
  logWsDisconnection: vi.fn(),
  logWsError: vi.fn(),
  logYjsUpdate: vi.fn(),
  logRoomActivity: vi.fn(),
  logHeartbeat: vi.fn(),
}));

// Mock the yjs.service to avoid database operations during tests
const mockYjsDoc = new Y.Doc();
mockYjsDoc.get('root', Y.XmlText);

vi.mock('../yjs.service', () => ({
  loadYjsDocumentState: vi.fn(async () => {
    const ydoc = new Y.Doc();
    ydoc.get('root', Y.XmlText);
    return ydoc;
  }),
  saveYjsDocumentState: vi.fn(async () => {}),
}));

describe('WebSocket Message Broadcasting Integration', () => {
  let wsManager: WebSocketManager;
  let wss: WebSocketServer;
  let testPort: number;

  beforeEach(() => {
    wsManager = new WebSocketManager();
    testPort = 8000 + Math.floor(Math.random() * 1000);
    wss = new WebSocketServer({ port: testPort });
    wsManager.initialize(wss);
  });

  afterEach(() => {
    wsManager.shutdown();
    wss.close();
  });

  describe('Yjs Update Broadcasting', () => {
    it('should broadcast Yjs update from one client to other clients in same room', async () => {
      const token1 = generateAccessToken({
        userId: 'user-1',
        email: 'test1@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const token2 = generateAccessToken({
        userId: 'user-2',
        email: 'test2@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws1 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token1}&draftId=draft-1`);
      const ws2 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token2}&draftId=draft-1`);

      // Wait for both connections to open
      await Promise.all([
        new Promise<void>((resolve) => ws1.on('open', resolve)),
        new Promise<void>((resolve) => ws2.on('open', resolve)),
      ]);

      // Give the server time to send initial state
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create a Yjs update
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;
      yText.insert(0, 'Hello from user 1');
      const update = Y.encodeStateAsUpdate(ydoc);

      // Client 2 listens for the broadcasted update
      const updateReceived = new Promise<boolean>((resolve) => {
        ws2.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'yjs-update') {
              // Verify the update data is present
              expect(message.data).toBeDefined();
              expect(Array.isArray(message.data)).toBe(true);
              resolve(true);
            }
          } catch (error) {
            // Ignore parsing errors for non-update messages
          }
        });
      });

      // Client 1 sends the update
      ws1.send(JSON.stringify({
        type: 'yjs-update',
        data: Array.from(update),
      }));

      // Wait for client 2 to receive the update
      const received = await Promise.race([
        updateReceived,
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000)),
      ]);

      expect(received).toBe(true);

      ws1.close();
      ws2.close();
    });

    it('should not broadcast to clients in different rooms', async () => {
      const token1 = generateAccessToken({
        userId: 'user-1',
        email: 'test1@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const token2 = generateAccessToken({
        userId: 'user-2',
        email: 'test2@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws1 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token1}&draftId=draft-1`);
      const ws2 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token2}&draftId=draft-2`);

      // Wait for both connections to open
      await Promise.all([
        new Promise<void>((resolve) => ws1.on('open', resolve)),
        new Promise<void>((resolve) => ws2.on('open', resolve)),
      ]);

      // Give the server time to send initial state
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create a Yjs update
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;
      yText.insert(0, 'Hello from user 1');
      const update = Y.encodeStateAsUpdate(ydoc);

      // Client 2 listens for any update (should NOT receive one)
      let updateReceived = false;
      ws2.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'yjs-update') {
            updateReceived = true;
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });

      // Client 1 sends the update
      ws1.send(JSON.stringify({
        type: 'yjs-update',
        data: Array.from(update),
      }));

      // Wait to ensure no update is received
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(updateReceived).toBe(false);

      ws1.close();
      ws2.close();
    });

    it('should broadcast to multiple clients in same room', async () => {
      const token1 = generateAccessToken({
        userId: 'user-1',
        email: 'test1@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const token2 = generateAccessToken({
        userId: 'user-2',
        email: 'test2@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const token3 = generateAccessToken({
        userId: 'user-3',
        email: 'test3@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws1 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token1}&draftId=draft-1`);
      const ws2 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token2}&draftId=draft-1`);
      const ws3 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token3}&draftId=draft-1`);

      // Wait for all connections to open
      await Promise.all([
        new Promise<void>((resolve) => ws1.on('open', resolve)),
        new Promise<void>((resolve) => ws2.on('open', resolve)),
        new Promise<void>((resolve) => ws3.on('open', resolve)),
      ]);

      // Give the server time to send initial state
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create a Yjs update
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;
      yText.insert(0, 'Hello from user 1');
      const update = Y.encodeStateAsUpdate(ydoc);

      // Set up listeners BEFORE sending the update
      const update2Promise = new Promise<boolean>((resolve) => {
        ws2.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'yjs-update') {
              resolve(true);
            }
          } catch (error) {
            // Ignore parsing errors
          }
        });
        setTimeout(() => resolve(false), 2000);
      });

      const update3Promise = new Promise<boolean>((resolve) => {
        ws3.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'yjs-update') {
              resolve(true);
            }
          } catch (error) {
            // Ignore parsing errors
          }
        });
        setTimeout(() => resolve(false), 2000);
      });

      // Client 1 sends the update
      ws1.send(JSON.stringify({
        type: 'yjs-update',
        data: Array.from(update),
      }));

      // Wait for both clients to receive the update
      const updates = await Promise.all([update2Promise, update3Promise]);

      // Both clients should have received the update
      expect(updates).toEqual([true, true]);

      ws1.close();
      ws2.close();
      ws3.close();
    });

    it('should not send update back to sender', async () => {
      const token1 = generateAccessToken({
        userId: 'user-1',
        email: 'test1@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const token2 = generateAccessToken({
        userId: 'user-2',
        email: 'test2@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws1 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token1}&draftId=draft-1`);
      const ws2 = new WebSocket(`ws://localhost:${testPort}/ws?token=${token2}&draftId=draft-1`);

      // Wait for both connections to open
      await Promise.all([
        new Promise<void>((resolve) => ws1.on('open', resolve)),
        new Promise<void>((resolve) => ws2.on('open', resolve)),
      ]);

      // Give the server time to send initial state
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Track if ws1 receives its own update back
      let receivedOwnUpdate = false;
      ws1.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'yjs-update') {
            receivedOwnUpdate = true;
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });

      // Create and send a Yjs update from ws1
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;
      yText.insert(0, 'Hello from user 1');
      const update = Y.encodeStateAsUpdate(ydoc);

      ws1.send(JSON.stringify({
        type: 'yjs-update',
        data: Array.from(update),
      }));

      // Wait to ensure ws1 doesn't receive its own update
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(receivedOwnUpdate).toBe(false);

      ws1.close();
      ws2.close();
    });
  });

  describe('Initial State Sync', () => {
    it('should send initial Yjs state to newly connected client', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws = new WebSocket(`ws://localhost:${testPort}/ws?token=${token}&draftId=draft-1`);

      const stateReceived = new Promise<boolean>((resolve) => {
        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'yjs-state-response') {
              expect(message.data).toBeDefined();
              expect(Array.isArray(message.data)).toBe(true);
              resolve(true);
            }
          } catch (error) {
            // Ignore parsing errors
          }
        });

        setTimeout(() => resolve(false), 2000);
      });

      await new Promise<void>((resolve) => ws.on('open', resolve));

      const received = await stateReceived;
      expect(received).toBe(true);

      ws.close();
    });
  });
});
