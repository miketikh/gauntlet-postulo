/**
 * Collaborative Editor Component
 * Example component showing how to use RichTextEditor with Yjs collaboration
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 * Updated for Story 4.5 - Implement Presence Awareness
 */

'use client';

import React, { useState, useMemo } from 'react';
import { RichTextEditor } from './rich-text-editor';
import { useYjsCollaboration } from '@/lib/hooks/use-yjs-collaboration';
import { usePresenceAwareness } from '@/lib/hooks/use-presence-awareness';
import { useScrollToCursor } from '@/lib/hooks/use-scroll-to-cursor';
import { useAuth } from '@/lib/hooks/use-auth';
import { ConnectionStatus, OfflineBanner } from './connection-status';
import { PresenceIndicator } from './presence-indicator';
import { ActiveUsersList } from './active-users-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle, CheckCircle2, PanelRightClose, PanelRight } from 'lucide-react';

export interface CollaborativeEditorProps {
  /**
   * Draft ID for loading/saving Yjs state
   */
  draftId: string;

  /**
   * Plain text snapshot used to hydrate the editor if no Yjs state exists yet
   */
  initialPlainText?: string;

  /**
   * Whether the editor is editable
   */
  editable?: boolean;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Auto-save interval in milliseconds
   */
  autoSaveInterval?: number;

  /**
   * Whether to enable real-time WebSocket collaboration
   */
  enableWebSocket?: boolean;

  /**
   * Whether to show connection status indicator
   */
  showConnectionStatus?: boolean;

  /**
   * Whether to enable presence awareness (user cursors and selections)
   */
  enablePresence?: boolean;

  /**
   * Whether to show presence indicators (active users list)
   */
  showPresenceIndicators?: boolean;

  /**
   * Layout mode: 'inline' (compact top bar) or 'sidebar' (side panel)
   */
  presenceLayout?: 'inline' | 'sidebar';

  /**
   * Whether to show the full active users list panel
   */
  showActiveUsersList?: boolean;
}

/**
 * Collaborative editor with Yjs integration
 *
 * This component:
 * 1. Loads the Yjs document state from the database
 * 2. Binds the Lexical editor to the Yjs document
 * 3. Auto-saves changes periodically
 * 4. Shows save status and loading states
 * 5. Provides manual save button
 */
export function CollaborativeEditor({
  draftId,
  initialPlainText,
  editable = true,
  className,
  placeholder = 'Start typing...',
  autoSaveInterval = 30000,
  enableWebSocket = true,
  showConnectionStatus = true,
  enablePresence = true,
  showPresenceIndicators = true,
  presenceLayout = 'sidebar',
  showActiveUsersList = true,
}: CollaborativeEditorProps) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const {
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
  } = useYjsCollaboration({
    draftId,
    autoSaveInterval,
    enableWebSocket,
  });

  const memoizedUser = useMemo(
    () =>
      user
        ? {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          }
        : null,
    [user?.id, user?.firstName, user?.lastName, user?.email]
  );

  // Initialize presence awareness
  const {
    remoteUsers,
    updateCursor,
    updateActivity,
  } = usePresenceAwareness({
    provider: provider || null,
    user: memoizedUser,
    enabled: enablePresence && enableWebSocket && isConnected,
  });

  // Initialize scroll-to-cursor functionality
  const { scrollToUserCursor } = useScrollToCursor({
    enabled: true,
  });

  // Show loading state while document loads
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading document...</span>
      </div>
    );
  }

  // Show error state if load failed
  if (error || !ydoc) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || 'Failed to load document'}
        </AlertDescription>
      </Alert>
    );
  }

  // Determine if we should show the sidebar layout
  const showSidebar = presenceLayout === 'sidebar' && showActiveUsersList && enablePresence && isConnected;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col space-y-2 min-w-0">
        {/* Offline banner - shows when WebSocket is disconnected */}
        {enableWebSocket && !isConnected && (
          <OfflineBanner
            show={connectionStatus === 'disconnected'}
            onReconnect={reconnect}
            offlineDuration={offlineDuration}
            isLongOfflinePeriod={isLongOfflinePeriod}
          />
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between px-2 py-1 text-sm text-muted-foreground border-b">
          <div className="flex items-center space-x-4">
            {/* Presence indicators (inline mode or mobile) */}
            {enablePresence && showPresenceIndicators && isConnected && presenceLayout === 'inline' && (
              <PresenceIndicator
                remoteUsers={remoteUsers}
                currentUserName={user ? `${user.firstName} ${user.lastName}` : undefined}
                onUserClick={scrollToUserCursor}
              />
            )}

            {/* Connection status */}
            {enableWebSocket && showConnectionStatus && (
              <ConnectionStatus
                status={connectionStatus}
                onReconnect={reconnect}
                showReconnectButton={false}
                variant="badge"
              />
            )}

            {/* Save status */}
            <div className="flex items-center space-x-2">
              {isSaving && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {!isSaving && hasUnsavedChanges && (
                <>
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                  <span>Unsaved changes</span>
                </>
              )}
              {!isSaving && !hasUnsavedChanges && (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>{isConnected ? 'Synced' : 'All changes saved'}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Manual save button */}
            {hasUnsavedChanges && (
              <Button
                size="sm"
                variant="outline"
                onClick={saveNow}
                disabled={isSaving}
              >
                <Save className="h-3 w-3 mr-1" />
                Save now
              </Button>
            )}

            {/* Sidebar toggle button */}
            {showSidebar && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:flex"
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {isSidebarOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Editor */}
        <RichTextEditor
          initialContent={initialPlainText}
          placeholder={placeholder}
          editable={editable}
          yjsDocument={ydoc}
          className={className}
          presenceEnabled={enablePresence && enableWebSocket}
          remoteUsers={remoteUsers}
          onCursorChange={updateCursor}
          onActivity={updateActivity}
          onRefineWithAI={undefined}
        />
      </div>

      {/* Sidebar with active users list */}
      {showSidebar && (
        <div
          className={`
            lg:w-80 flex-shrink-0
            ${isSidebarOpen ? 'block' : 'hidden lg:hidden'}
            transition-all duration-300
          `}
        >
          <div className="sticky top-4">
            {/* Desktop view - full panel */}
            <div className="hidden lg:block">
              <ActiveUsersList
                remoteUsers={remoteUsers}
            currentUser={memoizedUser}
                onUserClick={scrollToUserCursor}
                storageKey={`active-users-list-collapsed-${draftId}`}
              />
            </div>

            {/* Mobile view - compact button */}
            <div className="lg:hidden">
              <ActiveUsersList
                remoteUsers={remoteUsers}
                currentUser={
                  user
                    ? {
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                      }
                    : null
                }
                onUserClick={scrollToUserCursor}
                mobileView={true}
                storageKey={`active-users-list-collapsed-${draftId}-mobile`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
