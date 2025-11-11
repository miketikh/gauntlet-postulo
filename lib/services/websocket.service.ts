/**
 * WebSocket Service
 * Handles real-time collaboration via WebSocket connections
 * Part of Story 4.3 - Implement WebSocket Server for Real-Time Sync
 * Updated Story 4.11 - Added permission checks
 */

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse as parseUrl } from 'url';
import { verifyAccessToken, JWTPayload } from './auth.service';
import { loadYjsDocumentState, saveYjsDocumentState } from './yjs.service';
import {
  changeTrackingManager,
  calculateChangeSize,
  extractUserIdFromOrigin
} from './change-tracking.service';
import { createSnapshotFromTracking } from './snapshot.service';
import { checkDraftPermission } from './permission.service';
import * as Y from 'yjs';
import {
  logger,
  logWsConnection,
  logWsDisconnection,
  logWsError,
  logYjsUpdate,
  logRoomActivity,
  logHeartbeat,
} from '../utils/logger';

/**
 * Extended WebSocket with metadata
 */
interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  firmId?: string;
  draftId?: string;
  connectionId?: string;
  isAlive?: boolean;
  lastHeartbeat?: number;
}

/**
 * Message types for WebSocket communication
 */
enum MessageType {
  YJS_UPDATE = 'yjs-update',
  YJS_STATE_REQUEST = 'yjs-state-request',
  YJS_STATE_RESPONSE = 'yjs-state-response',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
}

/**
 * WebSocket message structure
 */
interface WSMessage {
  type: MessageType;
  data?: any;
  error?: string;
}

/**
 * WebSocket Manager
 * Manages rooms, connections, and message broadcasting
 */
export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, Set<ExtendedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT = 35000; // 35 seconds (must be > interval)

  /**
   * Initialize WebSocket server
   */
  initialize(wss: WebSocketServer): void {
    this.wss = wss;

    // Set up connection handler
    this.wss.on('connection', this.handleConnection.bind(this));

    // Start heartbeat mechanism
    this.startHeartbeat();

    logger.info('WebSocket server initialized', {
      action: 'ws.initialize',
      heartbeatInterval: this.HEARTBEAT_INTERVAL,
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: ExtendedWebSocket, request: IncomingMessage): Promise<void> {
    const connectionId = this.generateConnectionId();
    ws.connectionId = connectionId;
    ws.isAlive = true;
    ws.lastHeartbeat = Date.now();

    try {
      // Parse URL and extract query parameters
      const url = parseUrl(request.url || '', true);
      const { token, draftId } = url.query;

      // Validate required parameters
      if (!token || typeof token !== 'string') {
        this.sendError(ws, 'Missing authentication token');
        ws.close(1008, 'Missing authentication token');
        return;
      }

      if (!draftId || typeof draftId !== 'string') {
        this.sendError(ws, 'Missing draftId parameter');
        ws.close(1008, 'Missing draftId parameter');
        return;
      }

      // Verify JWT token
      let user: JWTPayload;
      try {
        user = verifyAccessToken(token);
      } catch (error) {
        this.sendError(ws, 'Invalid or expired token');
        ws.close(1008, 'Authentication failed');
        logWsError({
          connectionId,
          error: error as Error,
          context: 'JWT verification failed',
        });
        return;
      }

      // Attach user metadata to connection
      ws.userId = user.userId;
      ws.firmId = user.firmId;
      ws.draftId = draftId;

      // Story 4.11: Check draft permissions
      // User must have at least 'view' permission to connect to WebSocket
      const permission = await checkDraftPermission(draftId, user.userId, user.firmId);

      if (!permission) {
        this.sendError(ws, 'Access denied. You do not have permission to access this draft.');
        ws.close(1008, 'Insufficient permissions');
        logWsError({
          connectionId,
          error: new Error('Permission denied'),
          context: `User ${user.userId} attempted to access draft ${draftId} without permission`,
        });
        return;
      }

      // Log the permission level for monitoring
      logger.info('WebSocket connection permission validated', {
        action: 'ws.permission_check',
        userId: user.userId,
        draftId,
        permission,
        connectionId,
      });

      // Add to room
      this.addToRoom(draftId, ws);

      // Initialize change tracking for this draft
      changeTrackingManager.initializeTracking(draftId);

      // Log successful connection
      logWsConnection({
        userId: user.userId,
        firmId: user.firmId,
        draftId,
        connectionId,
      });

      // Send initial Yjs state to client
      await this.sendInitialState(ws, draftId);

      // Set up message handler
      ws.on('message', (data: Buffer) => this.handleMessage(ws, data));

      // Set up pong handler for heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
        ws.lastHeartbeat = Date.now();
      });

      // Set up close handler
      ws.on('close', (code: number, reason: Buffer) => {
        this.handleDisconnect(ws, code, reason.toString());
      });

      // Set up error handler
      ws.on('error', (error: Error) => {
        logWsError({
          userId: ws.userId,
          firmId: ws.firmId,
          draftId: ws.draftId,
          connectionId,
          error,
          context: 'WebSocket error event',
        });
      });

    } catch (error) {
      logWsError({
        connectionId,
        error: error as Error,
        context: 'Connection setup failed',
      });
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(ws: ExtendedWebSocket, data: Buffer): Promise<void> {
    try {
      const message: WSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case MessageType.YJS_UPDATE:
          await this.handleYjsUpdate(ws, message.data);
          break;

        case MessageType.YJS_STATE_REQUEST:
          await this.handleStateRequest(ws);
          break;

        case MessageType.PONG:
          ws.isAlive = true;
          ws.lastHeartbeat = Date.now();
          break;

        default:
          logger.warn('Unknown message type', {
            action: 'ws.unknown_message',
            type: message.type,
            connectionId: ws.connectionId,
          });
      }
    } catch (error) {
      logWsError({
        userId: ws.userId,
        firmId: ws.firmId,
        draftId: ws.draftId,
        connectionId: ws.connectionId!,
        error: error as Error,
        context: 'Message handling failed',
      });
    }
  }

  /**
   * Handle Yjs update from client
   */
  private async handleYjsUpdate(ws: ExtendedWebSocket, updateData: any): Promise<void> {
    if (!ws.draftId || !ws.userId) {
      return;
    }

    try {
      // Convert update data to Uint8Array
      const update = new Uint8Array(updateData);

      // Track change for snapshot creation
      const changeSize = calculateChangeSize(update);
      changeTrackingManager.recordChange(ws.draftId, ws.userId, changeSize);

      // Broadcast to all other clients in the room
      const clientCount = this.broadcastToRoom(ws.draftId, ws, {
        type: MessageType.YJS_UPDATE,
        data: Array.from(update), // Convert to regular array for JSON serialization
      });

      // Log the update
      logYjsUpdate({
        draftId: ws.draftId,
        fromUserId: ws.userId,
        clientCount,
        updateSize: update.length,
      });

      // Apply update to server-side Yjs document and save to database
      // This ensures the document state is persisted
      const ydoc = await loadYjsDocumentState(ws.draftId);
      Y.applyUpdate(ydoc, update);
      await saveYjsDocumentState(ws.draftId, ydoc);

      // Check if snapshot should be created
      if (changeTrackingManager.shouldCreateSnapshot(ws.draftId)) {
        // Create snapshot asynchronously (don't block the update)
        createSnapshotFromTracking(ws.draftId, ws.userId).catch((error) => {
          logger.error('Failed to create automatic snapshot', {
            action: 'ws.snapshot_failed',
            draftId: ws.draftId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }

    } catch (error) {
      logWsError({
        userId: ws.userId,
        firmId: ws.firmId,
        draftId: ws.draftId,
        connectionId: ws.connectionId!,
        error: error as Error,
        context: 'Yjs update handling failed',
      });
    }
  }

  /**
   * Handle request for full Yjs state
   */
  private async handleStateRequest(ws: ExtendedWebSocket): Promise<void> {
    if (!ws.draftId) {
      return;
    }

    try {
      await this.sendInitialState(ws, ws.draftId);
    } catch (error) {
      logWsError({
        userId: ws.userId,
        firmId: ws.firmId,
        draftId: ws.draftId,
        connectionId: ws.connectionId!,
        error: error as Error,
        context: 'State request handling failed',
      });
    }
  }

  /**
   * Send initial Yjs document state to newly connected client
   */
  private async sendInitialState(ws: ExtendedWebSocket, draftId: string): Promise<void> {
    try {
      // Load Yjs document state from database
      const ydoc = await loadYjsDocumentState(draftId);
      const state = Y.encodeStateAsUpdate(ydoc);

      // Send state to client
      this.sendMessage(ws, {
        type: MessageType.YJS_STATE_RESPONSE,
        data: Array.from(state), // Convert to regular array for JSON serialization
      });
    } catch (error) {
      logWsError({
        userId: ws.userId,
        firmId: ws.firmId,
        draftId,
        connectionId: ws.connectionId!,
        error: error as Error,
        context: 'Failed to send initial state',
      });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(ws: ExtendedWebSocket, code: number, reason: string): void {
    if (ws.draftId) {
      this.removeFromRoom(ws.draftId, ws);
    }

    logWsDisconnection({
      userId: ws.userId,
      firmId: ws.firmId,
      draftId: ws.draftId,
      connectionId: ws.connectionId!,
      reason: reason || `Code: ${code}`,
    });
  }

  /**
   * Add client to a room
   */
  private addToRoom(draftId: string, ws: ExtendedWebSocket): void {
    if (!this.rooms.has(draftId)) {
      this.rooms.set(draftId, new Set());
    }

    this.rooms.get(draftId)!.add(ws);

    logRoomActivity({
      draftId,
      action: 'join',
      userId: ws.userId,
      clientCount: this.rooms.get(draftId)!.size,
    });
  }

  /**
   * Remove client from a room
   */
  private removeFromRoom(draftId: string, ws: ExtendedWebSocket): void {
    const room = this.rooms.get(draftId);
    if (!room) {
      return;
    }

    room.delete(ws);

    logRoomActivity({
      draftId,
      action: 'leave',
      userId: ws.userId,
      clientCount: room.size,
    });

    // Clean up empty rooms
    if (room.size === 0) {
      this.rooms.delete(draftId);
    }
  }

  /**
   * Broadcast message to all clients in a room except sender
   */
  private broadcastToRoom(draftId: string, sender: ExtendedWebSocket, message: WSMessage): number {
    const room = this.rooms.get(draftId);
    if (!room) {
      return 0;
    }

    let count = 0;
    room.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
        count++;
      }
    });

    return count;
  }

  /**
   * Send message to a client
   */
  private sendMessage(ws: ExtendedWebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: ExtendedWebSocket, error: string): void {
    this.sendMessage(ws, {
      type: MessageType.ERROR,
      error,
    });
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) {
        return;
      }

      this.wss.clients.forEach((ws) => {
        const client = ws as ExtendedWebSocket;

        // Check if client hasn't responded to previous ping
        if (client.isAlive === false) {
          logHeartbeat({
            connectionId: client.connectionId!,
            status: 'timeout',
          });
          return client.terminate();
        }

        // Mark as not alive, will be set to true on pong
        client.isAlive = false;

        // Send ping
        client.ping();

        logHeartbeat({
          connectionId: client.connectionId!,
          status: 'ping',
        });
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active connections count
   */
  getConnectionsCount(): number {
    return this.wss?.clients.size || 0;
  }

  /**
   * Get room count
   */
  getRoomsCount(): number {
    return this.rooms.size;
  }

  /**
   * Get clients in a room
   */
  getRoomClients(draftId: string): number {
    return this.rooms.get(draftId)?.size || 0;
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    this.stopHeartbeat();

    if (this.wss) {
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });

      this.wss.close(() => {
        logger.info('WebSocket server closed', { action: 'ws.shutdown' });
      });
    }

    this.rooms.clear();
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();
