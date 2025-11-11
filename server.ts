/**
 * Custom Next.js Server with WebSocket Support
 * Enables real-time collaboration via WebSocket alongside Next.js API routes
 * Part of Story 4.3 - Implement WebSocket Server for Real-Time Sync
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { wsManager } from './lib/services/websocket.service';
import { logger } from './lib/utils/logger';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error('Error handling request', {
        error: err instanceof Error ? err.message : String(err),
        url: req.url,
      });
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Create WebSocket server on the same HTTP server
  const wss = new WebSocketServer({
    server,
    path: '/ws', // WebSocket endpoint at ws://localhost:3000/ws
  });

  // Initialize WebSocket manager
  wsManager.initialize(wss);

  // Make WebSocket server available for comment broadcasting
  const { setWebSocketServer } = require('./lib/services/comment-websocket.service');
  setWebSocketServer(wss);

  logger.info('WebSocket server created', {
    action: 'server.ws_created',
    path: '/ws',
  });

  // Start listening
  server.listen(port, () => {
    logger.info('Server started', {
      action: 'server.start',
      url: `http://${hostname}:${port}`,
      wsUrl: `ws://${hostname}:${port}/ws`,
      environment: dev ? 'development' : 'production',
    });

    console.log(`
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Steno Demand Letter Generator                        │
│                                                         │
│   HTTP Server:  http://${hostname}:${port.toString().padEnd(31)}│
│   WebSocket:    ws://${hostname}:${port}/ws${' '.repeat(23)}│
│   Environment:  ${dev ? 'development' : 'production'}${' '.repeat(32)}│
│                                                         │
└─────────────────────────────────────────────────────────┘
    `);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    logger.info('Received shutdown signal', { action: 'server.shutdown' });

    // Close WebSocket server
    wsManager.shutdown();

    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed', { action: 'server.closed' });
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout', { action: 'server.force_shutdown' });
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
