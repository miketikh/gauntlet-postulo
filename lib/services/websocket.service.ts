/**
 * WebSocket Service
 * Handles real-time collaboration via WebSocket connections
 * Based on y-websocket implementation with authentication
 */

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse as parseUrl } from 'url';
import { verifyAccessToken, JWTPayload } from './auth.service';
import { checkDraftPermission } from './permission.service';
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import {
  logger,
  logWsConnection,
  logWsDisconnection,
  logWsError,
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
}

/**
 * y-websocket protocol message types
 */
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

/**
 * Shared Yjs document with connections
 */
class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<ExtendedWebSocket, Set<number>>;
  awareness: awarenessProtocol.Awareness;

  constructor(name: string) {
    super({ gc: true });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    // Handle awareness updates
    const awarenessChangeHandler = ({ added, updated, removed }: any, conn: ExtendedWebSocket | null) => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIDs = this.conns.get(conn);
        if (connControlledIDs !== undefined) {
          added.forEach((clientID: number) => connControlledIDs.add(clientID));
          removed.forEach((clientID: number) => connControlledIDs.delete(clientID));
        }
      }
      // Broadcast awareness update
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients));
      const buff = encoding.toUint8Array(encoder);
      this.conns.forEach((_, c) => {
        send(this, c, buff);
      });
    };
    this.awareness.on('update', awarenessChangeHandler);

    // Handle document updates
    this.on('update', (update: Uint8Array, origin: any) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);
      this.conns.forEach((_, conn) => send(this, conn, message));
    });
  }
}

/**
 * Send message to connection
 */
const send = (doc: WSSharedDoc, conn: ExtendedWebSocket, message: Uint8Array) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn);
    return;
  }
  try {
    conn.send(message, (err: any) => {
      if (err != null) {
        closeConn(doc, conn);
      }
    });
  } catch (e) {
    closeConn(doc, conn);
  }
};

/**
 * Close connection and cleanup
 */
const closeConn = (doc: WSSharedDoc, conn: ExtendedWebSocket) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    if (controlledIds) {
      awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
    }
  }
  try {
    conn.close();
  } catch (e) {
    // Already closed
  }
};

/**
 * Handle incoming message from client
 */
const messageListener = (conn: ExtendedWebSocket, doc: WSSharedDoc, message: Uint8Array) => {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MESSAGE_SYNC:
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

        // Only send if there's actual content (length > 1)
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case MESSAGE_AWARENESS:
        awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn);
        break;
    }
  } catch (err) {
    logger.error('Message handling error', {
      action: 'ws.message_error',
      error: err instanceof Error ? err.message : String(err),
      connectionId: conn.connectionId,
    });
  }
};

/**
 * WebSocket Manager
 * Manages Yjs documents with authentication
 */
export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private docs: Map<string, WSSharedDoc> = new Map();
  private readonly PING_INTERVAL = 30000; // 30 seconds

  /**
   * Get or create shared document
   */
  private getYDoc(docName: string): WSSharedDoc {
    if (!this.docs.has(docName)) {
      const doc = new WSSharedDoc(docName);
      this.docs.set(docName, doc);
    }
    return this.docs.get(docName)!;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(wss: WebSocketServer): void {
    this.wss = wss;

    // Set up connection handler
    this.wss.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket server initialized', {
      action: 'ws.initialize',
    });
  }

  /**
   * Handle new WebSocket connection with authentication
   */
  private async handleConnection(ws: ExtendedWebSocket, request: IncomingMessage): Promise<void> {
    const connectionId = this.generateConnectionId();
    ws.connectionId = connectionId;
    ws.isAlive = true;

    try {
      // Parse URL
      const url = parseUrl(request.url || '', true);
      const { token } = url.query;

      // Extract draft ID from path (y-websocket connects to /{draftId})
      const pathParts = (url.pathname || '').split('/').filter(p => p);
      const draftId = pathParts[0];

      // Validate parameters
      if (!token || typeof token !== 'string') {
        ws.close(1008, 'Missing authentication token');
        return;
      }

      if (!draftId || typeof draftId !== 'string') {
        ws.close(1008, 'Missing draftId');
        return;
      }

      // Verify JWT token
      let user: JWTPayload;
      try {
        user = verifyAccessToken(token);
      } catch (error) {
        ws.close(1008, 'Authentication failed');
        logWsError({
          connectionId,
          error: error as Error,
          context: 'JWT verification failed',
        });
        return;
      }

      // Check permissions
      const permission = await checkDraftPermission(
        draftId,
        user.userId,
        user.firmId,
        user.role
      );

      if (!permission) {
        ws.close(1008, 'Insufficient permissions');
        logWsError({
          connectionId,
          error: new Error('Permission denied'),
          context: `User ${user.userId} attempted to access draft ${draftId} without permission`,
        });
        return;
      }

      // Attach metadata
      ws.userId = user.userId;
      ws.firmId = user.firmId;
      ws.draftId = draftId;

      // Log connection
      logWsConnection({
        userId: user.userId,
        firmId: user.firmId,
        draftId,
        connectionId,
      });

      // Get or create document
      const doc = this.getYDoc(draftId);
      doc.conns.set(ws, new Set());

      // Set binary type
      ws.binaryType = 'arraybuffer';

      // Set up message handler
      ws.on('message', (message: ArrayBuffer) => {
        messageListener(ws, doc, new Uint8Array(message));
      });

      // Set up ping/pong for heartbeat
      let pongReceived = true;
      const pingInterval = setInterval(() => {
        if (!pongReceived) {
          if (doc.conns.has(ws)) {
            closeConn(doc, ws);
          }
          clearInterval(pingInterval);
        } else if (doc.conns.has(ws)) {
          pongReceived = false;
          try {
            ws.ping();
          } catch (e) {
            closeConn(doc, ws);
            clearInterval(pingInterval);
          }
        }
      }, this.PING_INTERVAL);

      ws.on('pong', () => {
        pongReceived = true;
      });

      // Set up close handler
      ws.on('close', () => {
        closeConn(doc, ws);
        clearInterval(pingInterval);
        logWsDisconnection({
          userId: ws.userId,
          firmId: ws.firmId,
          draftId: ws.draftId,
          connectionId: ws.connectionId!,
          reason: 'Connection closed',
        });
      });

      // Send sync step 1
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeSyncStep1(encoder, doc);
      send(doc, ws, encoding.toUint8Array(encoder));

      // Send awareness states
      const awarenessStates = doc.awareness.getStates();
      if (awarenessStates.size > 0) {
        const awarenessEncoder = encoding.createEncoder();
        encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          awarenessEncoder,
          awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
        );
        send(doc, ws, encoding.toUint8Array(awarenessEncoder));
      }

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
    return this.docs.size;
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.wss) {
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });

      this.wss.close(() => {
        logger.info('WebSocket server closed', { action: 'ws.shutdown' });
      });
    }

    this.docs.clear();
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();
