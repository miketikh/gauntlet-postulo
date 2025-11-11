/**
 * useYjsCollaboration Hook
 * Manages Yjs document lifecycle for collaborative editing
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { useWebSocketProvider } from './use-websocket-provider';
import { useAuth } from './use-auth';

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
  onConnectionStatusChange?: (status: 'connected' | 'connecting' | 'disconnected') => void;
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
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');

  // Get authentication token
  const { user } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

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
    onSync: () => {
      // When sync completes, consider changes as saved
      // (they're saved on the server via WebSocket)
      setHasUnsavedChanges(false);
    },
  });

  /**
   * Load Yjs document from database
   */
  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/drafts/${draftId}/yjs-state`);
      if (!response.ok) {
        throw new Error('Failed to load document');
      }

      const data = await response.json();

      // Create new Y.Doc
      const newYdoc = new Y.Doc();

      // If there's existing state, apply it
      if (data.yjsState) {
        const update = Uint8Array.from(atob(data.yjsState), (c) => c.charCodeAt(0));
        Y.applyUpdate(newYdoc, update);
      } else {
        // Initialize with empty root fragment
        newYdoc.getXmlFragment('root');
      }

      // Track the initial state
      lastSavedStateRef.current = encodeState(newYdoc);

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

        const response = await fetch(`/api/drafts/${draftId}/yjs-state`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            yjsState: base64Update,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save document');
        }

        lastSavedStateRef.current = currentState;
        setHasUnsavedChanges(false);

        if (onSaveComplete) {
          onSaveComplete();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        if (onSaveError) {
          onSaveError(error);
        }
        console.error('Failed to save Yjs document:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [draftId, onSaveComplete, onSaveError]
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
   * Load document on mount
   */
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  /**
   * Set up update listener and auto-save
   */
  useEffect(() => {
    if (!ydoc) return;

    const updateHandler = (update: Uint8Array, origin: any) => {
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);

      // Clear existing auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new auto-save timer
      autoSaveTimerRef.current = setTimeout(() => {
        saveDocument(ydoc);
      }, autoSaveInterval);
    };

    ydoc.on('update', updateHandler);

    return () => {
      ydoc.off('update', updateHandler);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [ydoc, autoSaveInterval, saveDocument]);

  /**
   * Save on unmount if there are unsaved changes
   */
  useEffect(() => {
    return () => {
      if (ydoc && hasUnsavedChanges) {
        // Attempt synchronous save on unmount
        saveDocument(ydoc);
      }
    };
  }, [ydoc, hasUnsavedChanges, saveDocument]);

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
