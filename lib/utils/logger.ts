/**
 * Logger Utility
 * Winston-based structured logging for WebSocket and application events
 * Based on architecture.md monitoring requirements
 */

import winston from 'winston';

// Log levels: error, warn, info, debug
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * Winston logger instance with JSON formatting
 */
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'steno-api' },
  transports: [
    // Console output for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

/**
 * Log WebSocket connection event
 */
export function logWsConnection(data: {
  userId: string;
  firmId: string;
  draftId: string;
  connectionId: string;
}) {
  logger.info('WebSocket connection established', {
    action: 'ws.connect',
    ...data,
  });
}

/**
 * Log WebSocket disconnection event
 */
export function logWsDisconnection(data: {
  userId?: string;
  firmId?: string;
  draftId?: string;
  connectionId: string;
  reason?: string;
}) {
  logger.info('WebSocket disconnected', {
    action: 'ws.disconnect',
    ...data,
  });
}

/**
 * Log WebSocket error
 */
export function logWsError(data: {
  userId?: string;
  firmId?: string;
  draftId?: string;
  connectionId: string;
  error: Error | string;
  context?: string;
}) {
  logger.error('WebSocket error', {
    action: 'ws.error',
    error: data.error instanceof Error ? data.error.message : data.error,
    stack: data.error instanceof Error ? data.error.stack : undefined,
    userId: data.userId,
    firmId: data.firmId,
    draftId: data.draftId,
    connectionId: data.connectionId,
    context: data.context,
  });
}

/**
 * Log Yjs update broadcast
 */
export function logYjsUpdate(data: {
  draftId: string;
  fromUserId: string;
  clientCount: number;
  updateSize: number;
}) {
  logger.debug('Yjs update broadcast', {
    action: 'yjs.update',
    ...data,
  });
}

/**
 * Log room activity
 */
export function logRoomActivity(data: {
  draftId: string;
  action: 'join' | 'leave' | 'broadcast';
  userId?: string;
  clientCount: number;
}) {
  logger.info('Room activity', {
    action: `room.${data.action}`,
    draftId: data.draftId,
    userId: data.userId,
    clientCount: data.clientCount,
  });
}

/**
 * Log heartbeat ping/pong
 */
export function logHeartbeat(data: {
  connectionId: string;
  status: 'ping' | 'pong' | 'timeout';
}) {
  logger.debug('Heartbeat', {
    action: `heartbeat.${data.status}`,
    connectionId: data.connectionId,
  });
}
