/**
 * useYjsCollaboration Hook
 * Manages Yjs document lifecycle for collaborative editing
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { useWebSocketProvider, ConnectionStatus } from './use-websocket-provider';
import { useAuth } from './use-auth';
import { apiClient } from '@/lib/api/client';

export interface UseYjsCollaborationOptions {
  /**
   * Draft ID for loading/saving Yjs state
   */
  draftId: string;

  /**
   * Auto-save interval in milliseconds
   * Defaults to 30000 (30 seconds)
   */
  autoSaveInterval?: number;

  /**
   * Whether to enable WebSocket real-time sync
   * Defaults to true
   */
  enableWebSocket?: boolean;

  /**
   * Callback when save completes
   */
  onSaveComplete?: () => void;

  /**
   * Callback when save fails
   */
  onSaveError?: (error: Error) => void;

  /**
   * Callback when WebSocket connection status changes
   */
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

export interface UseYjsCollaborationReturn {
  /**
   * The Yjs document instance
   */
  ydoc: Y.Doc | null;

  /**
   * Whether the document is loading from the database
   */
  isLoading: boolean;

  /**
   * Whether the document is currently saving
   */
  isSaving: boolean;

  /**
   * Whether there are unsaved changes
   */
  hasUnsavedChanges: boolean;

  /**
   * Manually trigger a save
   */
  saveNow: () => Promise<void>;

  /**
   * Error if any occurred during load/save
   */
  error: Error | null;

  /**
   * WebSocket connection status
   */
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'syncing';

  /**
   * Whether WebSocket is connected
   */
  isConnected: boolean;

  /**
   * Whether WebSocket is syncing
   */
  isSyncing: boolean;

  /**
   * Manually reconnect WebSocket
   */
  reconnect: () => void;

  /**
   * WebSocket provider instance (for awareness)
   */
  provider: any;

  /**
   * Duration in milliseconds that the connection has been offline
   */
  offlineDuration: number;

  /**
   * Whether the offline period exceeds 5 minutes (data loss risk)
   */
  isLongOfflinePeriod: boolean;
}

/**
 * Hook to manage Yjs document for collaborative editing
 *
 * This hook:
 * 1. Loads the Yjs document state from the database on mount
 * 2. Tracks changes to the Yjs document
 * 3. Auto-saves changes periodically
 * 4. Provides manual save functionality
 * 5. Tracks save/load status and errors
 */
export function useYjsCollaboration({
  draftId,
  autoSaveInterval = 30000,
  enableWebSocket = true,
  onSaveComplete,
  onSaveError,
  onConnectionStatusChange,
}: UseYjsCollaborationOptions): UseYjsCollaborationReturn {
  // Use ref for ydoc to avoid re-renders when it's created/updated
  // Only expose it via state for components that need to re-render when it changes
  const ydocRef = useRef<Y.Doc | null>(null);
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');
  const hasLoadedRef = useRef(false);

  // Get authentication token
  const { user, accessToken } = useAuth();
  const token = accessToken;

  // Store callbacks in refs to avoid dependency changes
  const onSaveCompleteRef = useRef(onSaveComplete);
  const onSaveErrorRef = useRef(onSaveError);

  useEffect(() => {
    onSaveCompleteRef.current = onSaveComplete;
    onSaveErrorRef.current = onSaveError;
  }, [onSaveComplete, onSaveError]);

  // Memoized callback for WebSocket sync completion
  const handleSync = useCallback(() => {
    // When sync completes, consider changes as saved
    // (they're saved on the server via WebSocket)
    setHasUnsavedChanges(false);
  }, []);

  // WebSocket provider for real-time sync
  const {
    status: connectionStatus,
    isConnected,
    isSyncing,
    reconnect,
    provider,
    offlineDuration,
    isLongOfflinePeriod,
  } = useWebSocketProvider({
    draftId,
    ydoc: ydoc!,
    token: token || '',
    enabled: enableWebSocket && !!ydoc && !!token,
    onStatusChange: onConnectionStatusChange,
    onSync: handleSync,
  });

  /**
   * Load Yjs document from database
   * This should only be called once on mount
   */
  const loadDocument = useCallback(async () => {
    // Prevent duplicate loads
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await apiClient.get(`/api/drafts/${draftId}/yjs-state`, {
        withCredentials: true,
      });

      // Create new Y.Doc only once
      const newYdoc = new Y.Doc();

      // If there's existing state, apply it
      if (data.yjsState) {
        const update = Uint8Array.from(atob(data.yjsState), (c) => c.charCodeAt(0));
        Y.applyUpdate(newYdoc, update);
      } else {
        // Initialize with empty root XmlText (required for Lexical binding)
        newYdoc.get('root', Y.XmlText);
      }

      // Track the initial state
      lastSavedStateRef.current = encodeState(newYdoc);

      // Store in both ref and state
      // Ref for stable reference, state for triggering initial render
      ydocRef.current = newYdoc;
      setYdoc(newYdoc);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Failed to load Yjs document:', error);
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  /**
   * Save Yjs document to database
   * Uses refs for callbacks to avoid dependency changes
   */
  const saveDocument = useCallback(
    async (doc: Y.Doc) => {
      try {
        setIsSaving(true);
        setError(null);

        const currentState = encodeState(doc);

        // Only save if state has changed
        if (currentState === lastSavedStateRef.current) {
          setIsSaving(false);
          return;
        }

        const update = Y.encodeStateAsUpdate(doc);
        const base64Update = btoa(String.fromCharCode(...update));

        await apiClient.put(
          `/api/drafts/${draftId}/yjs-state`,
          {
            yjsState: base64Update,
          },
          {
            withCredentials: true,
          }
        );

        lastSavedStateRef.current = currentState;
        setHasUnsavedChanges(false);

        if (onSaveCompleteRef.current) {
          onSaveCompleteRef.current();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        if (onSaveErrorRef.current) {
          onSaveErrorRef.current(error);
        }
        console.error('Failed to save Yjs document:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [draftId]
  );

  /**
   * Manual save trigger
   */
  const saveNow = useCallback(async () => {
    if (ydoc && hasUnsavedChanges) {
      await saveDocument(ydoc);
    }
  }, [ydoc, hasUnsavedChanges, saveDocument]);

  /**
   * Load document on mount - ONLY ONCE
   */
  useEffect(() => {
    loadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  /**
   * Set up update listener and auto-save
   * Uses ydocRef to avoid re-creating this effect
   */
  useEffect(() => {
    const doc = ydocRef.current;
    if (!doc) return;

    const updateHandler = (update: Uint8Array, origin: any) => {
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);

      // Clear existing auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new auto-save timer
      autoSaveTimerRef.current = setTimeout(() => {
        if (ydocRef.current) {
          saveDocument(ydocRef.current);
        }
      }, autoSaveInterval);
    };

    doc.on('update', updateHandler);

    return () => {
      doc.off('update', updateHandler);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [ydoc, autoSaveInterval, saveDocument]); // ydoc only to trigger when initially set

  /**
   * Save on unmount if there are unsaved changes
   */
  useEffect(() => {
    return () => {
      const doc = ydocRef.current;
      if (doc && hasLoadedRef.current) {
        // Attempt synchronous save on unmount
        saveDocument(doc);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only cleanup on unmount

  return {
    ydoc,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    saveNow,
    error,
    connectionStatus,
    isConnected,
    isSyncing,
    reconnect,
    provider,
    offlineDuration,
    isLongOfflinePeriod,
  };
}

/**
 * Helper to encode Y.Doc state as string for comparison
 */
function encodeState(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  return btoa(String.fromCharCode(...update));
}
