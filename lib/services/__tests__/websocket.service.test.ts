/**
 * WebSocket Service Tests
 * Unit tests for WebSocket connection handling and room management
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
vi.mock('../yjs.service', () => ({
  loadYjsDocumentState: vi.fn(async () => {
    const ydoc = new Y.Doc();
    ydoc.get('root', Y.XmlText);
    return ydoc;
  }),
  saveYjsDocumentState: vi.fn(async () => {}),
}));

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  let wss: WebSocketServer;
  let testPort: number;

  beforeEach(() => {
    // Create a new WebSocket manager for each test
    wsManager = new WebSocketManager();

    // Use a random port for testing
    testPort = 8000 + Math.floor(Math.random() * 1000);

    // Create WebSocket server
    wss = new WebSocketServer({ port: testPort });

    // Initialize the manager
    wsManager.initialize(wss);
  });

  afterEach(() => {
    // Clean up
    wsManager.shutdown();
    wss.close();
  });

  describe('Connection Management', () => {
    it('should accept connection with valid JWT token and draftId', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws = new WebSocket(`ws://localhost:${testPort}/ws?token=${token}&draftId=draft-1`);

      // Wait for connection to open
      await new Promise<void>((resolve) => {
        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          resolve();
        });
      });

      ws.close();
    });

    it('should reject connection without token', async () => {
      const ws = new WebSocket(`ws://localhost:${testPort}/ws?draftId=draft-1`);

      // Wait for connection to close
      await new Promise<void>((resolve) => {
        ws.on('close', (code, reason) => {
          expect(code).toBe(1008); // Policy Violation
          expect(reason.toString()).toContain('authentication');
          resolve();
        });
      });
    });

    it('should reject connection without draftId', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws = new WebSocket(`ws://localhost:${testPort}/ws?token=${token}`);

      // Wait for connection to close
      await new Promise<void>((resolve) => {
        ws.on('close', (code, reason) => {
          expect(code).toBe(1008); // Policy Violation
          expect(reason.toString()).toContain('draftId');
          resolve();
        });
      });
    });

    it('should reject connection with invalid token', async () => {
      const ws = new WebSocket(`ws://localhost:${testPort}/ws?token=invalid-token&draftId=draft-1`);

      // Wait for connection to close
      await new Promise<void>((resolve) => {
        ws.on('close', (code, reason) => {
          expect(code).toBe(1008); // Policy Violation
          expect(reason.toString()).toContain('Authentication');
          resolve();
        });
      });
    });
  });

  describe('Room Management', () => {
    it('should add client to room on connection', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws = new WebSocket(`ws://localhost:${testPort}/ws?token=${token}&draftId=draft-1`);

      await new Promise<void>((resolve) => {
        ws.on('open', () => {
          // Give the server time to process the connection
          setTimeout(() => {
            expect(wsManager.getRoomClients('draft-1')).toBe(1);
            expect(wsManager.getRoomsCount()).toBe(1);
            resolve();
          }, 100);
        });
      });

      ws.close();
    });

    it('should remove client from room on disconnect', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws = new WebSocket(`ws://localhost:${testPort}/ws?token=${token}&draftId=draft-1`);

      await new Promise<void>((resolve) => {
        ws.on('open', () => {
          setTimeout(() => {
            expect(wsManager.getRoomClients('draft-1')).toBe(1);
            ws.close();
          }, 100);
        });

        ws.on('close', () => {
          setTimeout(() => {
            expect(wsManager.getRoomClients('draft-1')).toBe(0);
            resolve();
          }, 100);
        });
      });
    });

    it('should handle multiple clients in same room', async () => {
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

      await Promise.all([
        new Promise<void>((resolve) => ws1.on('open', resolve)),
        new Promise<void>((resolve) => ws2.on('open', resolve)),
      ]);

      // Give the server time to process connections
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wsManager.getRoomClients('draft-1')).toBe(2);
      expect(wsManager.getRoomsCount()).toBe(1);

      ws1.close();
      ws2.close();
    });

    it('should handle multiple rooms', async () => {
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

      await Promise.all([
        new Promise<void>((resolve) => ws1.on('open', resolve)),
        new Promise<void>((resolve) => ws2.on('open', resolve)),
      ]);

      // Give the server time to process connections
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wsManager.getRoomClients('draft-1')).toBe(1);
      expect(wsManager.getRoomClients('draft-2')).toBe(1);
      expect(wsManager.getRoomsCount()).toBe(2);

      ws1.close();
      ws2.close();
    });
  });

  describe('Heartbeat Mechanism', () => {
    it('should respond to ping with pong', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws = new WebSocket(`ws://localhost:${testPort}/ws?token=${token}&draftId=draft-1`);

      await new Promise<void>((resolve) => {
        ws.on('open', () => {
          ws.on('pong', () => {
            // Pong received
            resolve();
          });

          // Send ping
          ws.ping();
        });
      });

      ws.close();
    });
  });

  describe('Connection Statistics', () => {
    it('should track total connections', async () => {
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

      await Promise.all([
        new Promise<void>((resolve) => ws1.on('open', resolve)),
        new Promise<void>((resolve) => ws2.on('open', resolve)),
      ]);

      // Give the server time to process connections
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wsManager.getConnectionsCount()).toBe(2);

      ws1.close();
      ws2.close();
    });
  });

  describe('Shutdown', () => {
    it('should close all connections on shutdown', async () => {
      const token = generateAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'attorney',
        firmId: 'firm-1',
      });

      const ws = new WebSocket(`ws://localhost:${testPort}/ws?token=${token}&draftId=draft-1`);

      await new Promise<void>((resolve) => {
        ws.on('open', resolve);
      });

      const closePromise = new Promise<void>((resolve) => {
        ws.on('close', (code, reason) => {
          expect(reason.toString()).toContain('shutting down');
          resolve();
        });
      });

      wsManager.shutdown();

      await closePromise;
    });
  });
});
