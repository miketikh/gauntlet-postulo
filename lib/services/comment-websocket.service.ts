/**
 * Comment WebSocket Service
 * Handles real-time comment updates via WebSocket
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

import { CommentWebSocketMessage } from '@/lib/types/comment';

/**
 * Broadcast comment event to all clients in a room
 * This is called from the API routes after a comment is created/updated/resolved
 */
export function broadcastCommentEvent(
  wss: any, // WebSocketServer instance
  draftId: string,
  message: CommentWebSocketMessage
): void {
  if (!wss || !wss.clients) return;

  const messageStr = JSON.stringify(message);
  let broadcastCount = 0;

  wss.clients.forEach((client: any) => {
    // Only broadcast to clients connected to the same draft
    if (
      client.readyState === 1 && // WebSocket.OPEN
      client.draftId === draftId
    ) {
      try {
        client.send(messageStr);
        broadcastCount++;
      } catch (error) {
        console.error('Failed to broadcast comment event:', error);
      }
    }
  });

  console.log(`Broadcasted comment event to ${broadcastCount} clients`, {
    type: message.type,
    draftId,
    threadId: message.threadId,
  });
}

/**
 * Get WebSocket server instance
 * This is a helper to access the WebSocket server from API routes
 */
let wsServerInstance: any = null;

export function setWebSocketServer(wss: any): void {
  wsServerInstance = wss;
}

export function getWebSocketServer(): any {
  return wsServerInstance;
}

/**
 * Helper to broadcast comment creation
 */
export function broadcastCommentCreated(
  draftId: string,
  threadId: string,
  comment: any
): void {
  const wss = getWebSocketServer();
  if (!wss) return;

  broadcastCommentEvent(wss, draftId, {
    type: 'comment:created',
    draftId,
    threadId,
    comment,
  });
}

/**
 * Helper to broadcast comment update
 */
export function broadcastCommentUpdated(
  draftId: string,
  threadId: string,
  comment: any
): void {
  const wss = getWebSocketServer();
  if (!wss) return;

  broadcastCommentEvent(wss, draftId, {
    type: 'comment:updated',
    draftId,
    threadId,
    comment,
  });
}

/**
 * Helper to broadcast thread resolved
 */
export function broadcastThreadResolved(
  draftId: string,
  threadId: string,
  resolved: boolean
): void {
  const wss = getWebSocketServer();
  if (!wss) return;

  broadcastCommentEvent(wss, draftId, {
    type: 'comment:resolved',
    draftId,
    threadId,
    resolved,
  });
}
