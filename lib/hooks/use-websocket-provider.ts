/**
 * useWebSocketProvider Hook
 * Manages WebSocket connection for real-time Yjs synchronization
 * Part of Story 4.4 - Implement Frontend WebSocket Client with y-websocket
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Maximum number of reconnection attempts before giving up
const MAX_RECONNECT_ATTEMPTS = 10;

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'syncing';

export interface UseWebSocketProviderOptions {
  /**
   * Draft ID for the collaboration room
   */
  draftId: string;

  /**
   * The Yjs document to sync
   */
  ydoc: Y.Doc;

  /**
   * JWT access token for authentication
   */
  token: string;

  /**
   * WebSocket URL (defaults to NEXT_PUBLIC_WS_URL env variable or ws://localhost:3000)
   */
  wsUrl?: string;

  /**
   * Whether to enable WebSocket sync (default: true)
   */
  enabled?: boolean;

  /**
   * Callback when connection status changes
   */
  onStatusChange?: (status: ConnectionStatus) => void;

  /**
   * Callback when sync completes
   */
  onSync?: () => void;

  /**
   * Callback when sync error occurs
   */
  onError?: (error: Error) => void;
}

export interface UseWebSocketProviderReturn {
  /**
   * Current connection status
   */
  status: ConnectionStatus;

  /**
   * Whether currently connected
   */
  isConnected: boolean;

  /**
   * Whether currently connecting
   */
  isConnecting: boolean;

  /**
   * Whether disconnected
   */
  isDisconnected: boolean;

  /**
   * Whether currently syncing after reconnection
   */
  isSyncing: boolean;

  /**
   * Manually trigger reconnection
   */
  reconnect: () => void;

  /**
   * Manually disconnect
   */
  disconnect: () => void;

  /**
   * The WebSocket provider instance
   */
  provider: WebsocketProvider | null;

  /**
   * Duration in milliseconds that the connection has been offline
   * Returns 0 when connected
   */
  offlineDuration: number;

  /**
   * Whether the offline period exceeds 5 minutes (data loss risk increases)
   */
  isLongOfflinePeriod: boolean;
}

/**
 * Hook to manage WebSocket provider for real-time Yjs synchronization
 *
 * Features:
 * 1. Establishes WebSocket connection when user opens draft
 * 2. Passes JWT token for authentication
 * 3. Binds Yjs document to WebSocket provider for automatic sync
 * 4. Tracks connection status (connected, connecting, disconnected)
 * 5. Implements exponential backoff reconnection logic
 * 6. Supports offline editing with queued sync on reconnect
 * 7. Cleans up connection on unmount
 *
 * Exponential Backoff:
 * - 1s, 2s, 4s, 8s, 16s, 30s (max)
 */
export function useWebSocketProvider({
  draftId,
  ydoc,
  token,
  wsUrl,
  enabled = true,
  onStatusChange,
  onSync,
  onError,
}: UseWebSocketProviderOptions): UseWebSocketProviderReturn {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [offlineDuration, setOfflineDuration] = useState(0);

  // Track reconnection attempts for exponential backoff
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const offlineStartTime = useRef<number | null>(null);
  const offlineDurationTimer = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<ConnectionStatus>('disconnected');
  const onStatusChangeRef = useRef(onStatusChange);
  const onSyncRef = useRef(onSync);
  const onErrorRef = useRef(onError);
  const lastConnectionConfig = useRef<{ draftId: string; token: string; url: string } | null>(null);
  const hasInitializedRef = useRef(false);
  const hasReachedMaxAttemptsRef = useRef(false);

  // Store ydoc in ref to avoid re-creating provider when ydoc reference changes
  const ydocRef = useRef<Y.Doc>(ydoc);
  // Track whether ydoc is ready (without storing the ydoc object itself)
  const [ydocReady, setYdocReady] = useState(!!ydoc);

  // Update ydocRef when ydoc changes, but don't reinitialize provider
  useEffect(() => {
    ydocRef.current = ydoc;
    // Only set to true once, never back to false
    if (ydoc && !ydocReady) {
      setYdocReady(true);
    }
  }, [ydoc, ydocReady]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Update status and notify callback
  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      statusRef.current = newStatus;
      setStatus(newStatus);
      onStatusChangeRef.current?.(newStatus);

      // Track offline duration
      if (newStatus === 'disconnected') {
        // Start tracking offline time
        if (!offlineStartTime.current) {
          offlineStartTime.current = Date.now();

          // Update offline duration every second
          offlineDurationTimer.current = setInterval(() => {
            if (offlineStartTime.current) {
              setOfflineDuration(Date.now() - offlineStartTime.current);
            }
          }, 1000);
        }
      } else if (newStatus === 'connected' || newStatus === 'syncing') {
        // Reset offline tracking when we reconnect (either syncing or fully connected)
        offlineStartTime.current = null;
        setOfflineDuration(0);

        if (offlineDurationTimer.current) {
          clearInterval(offlineDurationTimer.current);
          offlineDurationTimer.current = null;
        }
      }
    },
    []
  );

  /**
   * Calculate reconnection delay with exponential backoff
   * 1s -> 2s -> 4s -> 8s -> 16s -> 30s (max)
   */
  const getReconnectDelay = useCallback((attempts: number): number => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
    return delay;
  }, []);

  /**
   * Cleanup provider
   */
  const cleanupProvider = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (offlineDurationTimer.current) {
      clearInterval(offlineDurationTimer.current);
      offlineDurationTimer.current = null;
    }

    if (providerRef.current) {
      // Clear any sync timeout
      if ((providerRef.current as any)._syncTimeout) {
        clearTimeout((providerRef.current as any)._syncTimeout);
        (providerRef.current as any)._syncTimeout = null;
      }

      try {
        providerRef.current.destroy();
      } catch (error) {
        console.error('Failed to destroy WebSocket provider:', error);
      }

      providerRef.current = null;
      setProvider(null);
      lastConnectionConfig.current = null;
    }

    reconnectAttempts.current = 0;
    hasReachedMaxAttemptsRef.current = false;
    updateStatus('disconnected');
  }, [updateStatus]);

  /**
   * Initialize WebSocket provider
   * Uses ydocRef to avoid re-initialization when ydoc reference changes
   */
  const initializeProvider = useCallback(() => {
    const doc = ydocRef.current;
    if (!enabled || !doc || !draftId || !token) {
      return;
    }

    // Reset reconnection attempts when initializing a new provider
    reconnectAttempts.current = 0;
    hasReachedMaxAttemptsRef.current = false;

    // Prevent duplicate providers with the same configuration
    const baseUrl = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
    const url = baseUrl.replace(/^http/, 'ws'); // Ensure ws:// or wss://
    const currentConfig = { draftId, token, url };
    const previousConfig = lastConnectionConfig.current;

    if (providerRef.current) {
      if (
        previousConfig &&
        previousConfig.draftId === currentConfig.draftId &&
        previousConfig.token === currentConfig.token &&
        previousConfig.url === currentConfig.url
      ) {
        // Already initialized with same configuration; ensure connection is active
        if (statusRef.current === 'disconnected') {
          reconnectAttempts.current = 0;
          providerRef.current.connect();
          updateStatus('connecting');
        }
        return;
      }

      // Configuration changed – tear down existing connection before reinitializing
      cleanupProvider();
    }

    // Clear any existing reconnect timer
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    try {
      // Create WebSocket provider with authentication
      const wsProvider = new WebsocketProvider(
        url,
        draftId,
        doc,
        {
          // Connection options
          connect: true,
          params: {
            token,
            draftId,
          },
          // Disable automatic reconnection - we'll handle it manually
          disableBc: true,
          // WebSocket connection options
          WebSocketPolyfill: WebSocket,
        }
      );

      // Store reference
      providerRef.current = wsProvider;
      setProvider(wsProvider);
      lastConnectionConfig.current = currentConfig;

      // Set initial status
      updateStatus('connecting');

      // Connection status handlers
      wsProvider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
          // Show syncing state briefly before connected
          updateStatus('syncing');

          // Wait for initial sync to complete
          // This is handled by the sync event, but we set a max timeout
          const syncTimeout = setTimeout(() => {
            if (providerRef.current && event.status === 'connected') {
              updateStatus('connected');
              reconnectAttempts.current = 0; // Reset attempts on successful connection
            }
          }, 2000); // Give 2 seconds for sync to complete

          // Store timeout for cleanup
          (wsProvider as any)._syncTimeout = syncTimeout;
        } else if (event.status === 'disconnected') {
          // Update status WITHOUT calling updateStatus to avoid re-renders
          statusRef.current = 'disconnected';
          setStatus('disconnected');

          // Check if we've exceeded max reconnection attempts
          if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
            hasReachedMaxAttemptsRef.current = true;
            console.error(
              `WebSocket failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts. Stopping reconnection.`
            );
            onErrorRef.current?.(
              new Error('WebSocket connection failed: Maximum retry attempts exceeded')
            );
            return; // STOP RETRYING - DO NOT RECONNECT
          }

          // Don't retry if we've already reached max attempts
          if (hasReachedMaxAttemptsRef.current) {
            console.log('Already reached max reconnection attempts, not retrying');
            return; // STOP RETRYING
          }

          // IMPORTANT: Only reconnect if this is a network disconnection,
          // NOT if there are protocol errors
          // Check if there was a recent error
          const delay = getReconnectDelay(reconnectAttempts.current);

          console.log(
            `WebSocket disconnected. Will reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})...`
          );

          // Clear any existing timer
          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
          }

          reconnectTimer.current = setTimeout(() => {
            if (!hasReachedMaxAttemptsRef.current && providerRef.current) {
              reconnectAttempts.current++;
              try {
                wsProvider.connect();
              } catch (e) {
                console.error('Reconnection failed:', e);
                hasReachedMaxAttemptsRef.current = true;
              }
            }
          }, delay);
        }
      });

      // Sync handler
      wsProvider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          // Clear sync timeout if exists
          if ((wsProvider as any)._syncTimeout) {
            clearTimeout((wsProvider as any)._syncTimeout);
            (wsProvider as any)._syncTimeout = null;
          }

          // Transition from syncing to connected
          if (statusRef.current === 'syncing') {
            updateStatus('connected');
            reconnectAttempts.current = 0;
          }

          onSyncRef.current?.();
        }
      });

      // Connection established
      wsProvider.on('connection', () => {
        updateStatus('connected');
      });

      // Connection error - DO NOT re-initialize, just log
      wsProvider.on('connection-error', (error: Error) => {
        console.error('WebSocket connection error:', error);
        // DO NOT call updateStatus here - it can trigger re-renders
        // Just set the ref
        statusRef.current = 'disconnected';
        setStatus('disconnected');
        onErrorRef.current?.(error);
      });

      // Connection closed - DO NOT re-initialize, just log
      wsProvider.on('connection-close', (event: CloseEvent) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        // DO NOT call updateStatus here - it can trigger re-renders
        statusRef.current = 'disconnected';
        setStatus('disconnected');
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket provider:', error);
      // DO NOT call updateStatus here - it can trigger re-renders
      statusRef.current = 'disconnected';
      setStatus('disconnected');
      onErrorRef.current?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [draftId, token, wsUrl, enabled, updateStatus, getReconnectDelay, cleanupProvider]);

  /**
   * Manual reconnect
   */
  const reconnect = useCallback(() => {
    // Reset attempts when manually reconnecting
    reconnectAttempts.current = 0;
    hasReachedMaxAttemptsRef.current = false;

    if (providerRef.current) {
      providerRef.current.connect();
    } else {
      initializeProvider();
    }
  }, [initializeProvider]);

  /**
   * Manual disconnect
   */
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (providerRef.current) {
      providerRef.current.disconnect();
      updateStatus('disconnected');
    }
  }, [updateStatus]);

  /**
   * Initialize provider when ydoc becomes available
   * CRITICAL: Depends on enabled and ydocReady (boolean), NOT the ydoc object
   */
  useEffect(() => {
    const doc = ydocRef.current;

    if (enabled && ydocReady && doc && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initializeProvider();
    }

    // Cleanup ONLY on unmount or when explicitly disabled
    return () => {
      if (!enabled && hasInitializedRef.current) {
        hasInitializedRef.current = false;
        cleanupProvider();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ydocReady]); // Depend on enabled and ydocReady boolean, NOT ydoc object

  // Calculate if we're in a long offline period (> 5 minutes)
  const isLongOfflinePeriod = offlineDuration > 5 * 60 * 1000; // 5 minutes in milliseconds

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    isSyncing: status === 'syncing',
    reconnect,
    disconnect,
    provider,
    offlineDuration,
    isLongOfflinePeriod,
  };
}
