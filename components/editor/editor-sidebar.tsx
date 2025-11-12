/**
 * Editor Sidebar Component
 * Collapsible right sidebar with presence, comments, and version history
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActiveUsersList } from './active-users-list';
import { CommentsSidebar } from './comments/comments-sidebar';
import { VersionHistoryPanel } from './version-history-panel';
import { RefinementPanel } from './refinement-panel';
import { Users, MessageSquare, History, Sparkles, ChevronRight, ChevronLeft, Download } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { RemoteUser } from '@/lib/hooks/use-presence-awareness';
import { CommentThread } from '@/lib/types/comment';

export interface EditorSidebarProps {
  /**
   * Draft ID
   */
  draftId: string;

  /**
   * Current user information
   */
  currentUser?: {
    id: string;
    name: string;
    email: string;
  } | null;

  /**
   * Remote users (presence)
   */
  remoteUsers: RemoteUser[];

  /**
   * Comment threads
   */
  commentThreads: CommentThread[];

  /**
   * Whether the sidebar is collapsed
   */
  isCollapsed?: boolean;

  /**
   * Callback to toggle collapsed state
   */
  onToggleCollapse?: () => void;

  /**
   * Callback when a user is clicked (scroll to their cursor)
   */
  onUserClick?: (userId: string) => void;

  /**
   * Callback when a comment thread is clicked
   */
  onThreadClick?: (threadId: string) => void;

  /**
   * Comment callbacks
   */
  onReply?: (threadId: string, content: string) => Promise<void>;
  onResolve?: (threadId: string) => Promise<void>;
  onUnresolve?: (threadId: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onEditComment?: (commentId: string, content: string) => Promise<void>;
  onRefreshComments?: () => Promise<void>;

  /**
   * Version history callbacks
   */
  onViewVersion?: (version: number) => void;
  onCompareVersions?: (fromVersion: number, toVersion: number) => void;
  onRestoreVersion?: (version: number) => void;

  /**
   * Refinement panel props
   */
  refinementSelectedText?: string;
  isRefinementPanelOpen?: boolean;
  onCloseRefinementPanel?: () => void;
  onRefine?: (instruction: string, quickActionId?: string) => void;
  isRefining?: boolean;

  /**
   * Export props
   */
  projectTitle?: string;
  draftVersion?: number;
  onExport?: () => void;

  /**
   * Storage key for persisting sidebar state
   */
  storageKey?: string;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Collapsible sidebar with tabs for presence, comments, and version history
 *
 * Features:
 * - Tabbed interface for different sections
 * - Collapsible to maximize editor space
 * - Active users list with presence indicators
 * - Comment threads management
 * - Version history timeline
 * - State persistence
 */
export function EditorSidebar({
  draftId,
  currentUser,
  remoteUsers,
  commentThreads,
  isCollapsed = false,
  onToggleCollapse,
  onUserClick,
  onThreadClick,
  onReply,
  onResolve,
  onUnresolve,
  onDeleteComment,
  onEditComment,
  onRefreshComments,
  onViewVersion,
  onCompareVersions,
  onRestoreVersion,
  refinementSelectedText = '',
  isRefinementPanelOpen = false,
  onCloseRefinementPanel,
  onRefine,
  isRefining = false,
  projectTitle = 'Untitled',
  draftVersion = 1,
  onExport,
  storageKey = 'editor-sidebar',
  className,
}: EditorSidebarProps) {
  const [activeTab, setActiveTab] = useState<string>('presence');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem(`${storageKey}-active-tab`);
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, [storageKey]);

  // Save active tab to localStorage
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(`${storageKey}-active-tab`, tab);
  };

  // Count unread/unresolved items
  const unresolvedCommentsCount = commentThreads.filter((t) => !t.resolved).length;
  const activeUsersCount = remoteUsers.length + (currentUser ? 1 : 0);

  // Auto-switch to refinement tab when panel opens
  useEffect(() => {
    if (isRefinementPanelOpen) {
      setActiveTab('refinement');
    }
  }, [isRefinementPanelOpen]);

  if (isCollapsed) {
    return (
      <div className={cn('flex flex-col items-center border-l bg-background p-2', className)}>
        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="mb-4"
          aria-label="Expand sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Vertical icons */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 relative"
            onClick={() => {
              onToggleCollapse?.();
              setActiveTab('presence');
            }}
          >
            <Users className="h-5 w-5" />
            {activeUsersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                {activeUsersCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 relative"
            onClick={() => {
              onToggleCollapse?.();
              setActiveTab('comments');
            }}
          >
            <MessageSquare className="h-5 w-5" />
            {unresolvedCommentsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                {unresolvedCommentsCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            onClick={() => {
              onToggleCollapse?.();
              setActiveTab('history');
            }}
          >
            <History className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-10 h-10 p-0',
              isRefinementPanelOpen && 'bg-accent'
            )}
            onClick={() => {
              onToggleCollapse?.();
              setActiveTab('refinement');
            }}
          >
            <Sparkles className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
            onClick={() => {
              onToggleCollapse?.();
              setActiveTab('export');
            }}
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full border-l bg-background', className)}>
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Sidebar</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0"
          aria-label="Collapse sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1">
        {/* Tab list */}
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="presence"
            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Users className="h-4 w-4 mr-2" />
            <span>Presence</span>
            {activeUsersCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                {activeUsersCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="comments"
            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Comments</span>
            {unresolvedCommentsCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {unresolvedCommentsCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <History className="h-4 w-4 mr-2" />
            <span>History</span>
          </TabsTrigger>

          <TabsTrigger
            value="refinement"
            className={cn(
              'relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
              isRefinementPanelOpen && 'bg-accent'
            )}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span>Refine</span>
          </TabsTrigger>

          <TabsTrigger
            value="export"
            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Export</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab content */}
        <TabsContent value="presence" className="flex-1 m-0 overflow-hidden">
          <ActiveUsersList
            remoteUsers={remoteUsers}
            currentUser={currentUser || null}
            onUserClick={onUserClick ? (user) => onUserClick(user.state.user.id) : undefined}
            storageKey={`${storageKey}-presence`}
          />
        </TabsContent>

        <TabsContent value="comments" className="flex-1 m-0 overflow-hidden">
          <CommentsSidebar
            draftId={draftId}
            threads={commentThreads}
            currentUserId={currentUser?.id}
            onReply={onReply}
            onResolve={onResolve}
            onUnresolve={onUnresolve}
            onDelete={onDeleteComment}
            onEdit={onEditComment}
            onThreadClick={onThreadClick}
            onRefresh={onRefreshComments}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
          <VersionHistoryPanel
            draftId={draftId}
            onViewVersion={onViewVersion}
            onCompareVersions={onCompareVersions}
            onRestoreVersion={onRestoreVersion}
          />
        </TabsContent>

        <TabsContent value="refinement" className="flex-1 m-0 overflow-hidden">
          <RefinementPanel
            selectedText={refinementSelectedText}
            isOpen={isRefinementPanelOpen}
            onClose={onCloseRefinementPanel || (() => {})}
            onRefine={onRefine || (() => {})}
            isRefining={isRefining}
            className="h-full"
          />
        </TabsContent>

        <TabsContent value="export" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Export Document</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download your demand letter as a Word document.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Ready to Export</span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Document: {projectTitle}</div>
                  <div>Version: v{draftVersion}</div>
                  <div>Format: Microsoft Word (.docx)</div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={onExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Word
              </Button>

              <div className="text-xs text-muted-foreground">
                The exported document will include all formatting, firm letterhead (if configured), and metadata.
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
