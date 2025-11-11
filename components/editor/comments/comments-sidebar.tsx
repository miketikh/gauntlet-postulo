/**
 * Comments Sidebar Component
 * Sidebar displaying all comment threads for a draft
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CommentThread as CommentThreadType } from '@/lib/types/comment';
import { CommentThread } from './comment-thread';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquare, Filter, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface CommentsSidebarProps {
  draftId: string;
  threads: CommentThreadType[];
  currentUserId?: string;
  onReply?: (threadId: string, content: string) => Promise<void>;
  onResolve?: (threadId: string) => Promise<void>;
  onUnresolve?: (threadId: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onThreadClick?: (threadId: string) => void;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Sidebar component for displaying and managing comment threads
 *
 * Features:
 * - List of all comment threads
 * - Toggle to show/hide resolved comments
 * - Refresh button
 * - Empty state
 * - Thread interactions (reply, resolve, delete, edit)
 */
export function CommentsSidebar({
  draftId,
  threads,
  currentUserId,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
  onEdit,
  onThreadClick,
  onRefresh,
  isLoading = false,
}: CommentsSidebarProps) {
  const [showResolved, setShowResolved] = useState(false);
  const [filteredThreads, setFilteredThreads] = useState<CommentThreadType[]>([]);

  // Filter threads based on resolved status
  useEffect(() => {
    const filtered = showResolved
      ? threads
      : threads.filter((thread) => !thread.resolved);
    setFilteredThreads(filtered);
  }, [threads, showResolved]);

  const unresolvedCount = threads.filter((t) => !t.resolved).length;
  const resolvedCount = threads.filter((t) => t.resolved).length;

  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Comments</h3>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{unresolvedCount} active</span>
          <span>{resolvedCount} resolved</span>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Switch
            id="show-resolved"
            checked={showResolved}
            onCheckedChange={setShowResolved}
          />
          <Label htmlFor="show-resolved" className="text-sm cursor-pointer">
            Show resolved
          </Label>
        </div>
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {showResolved
                  ? 'No comments yet'
                  : threads.length > 0
                  ? 'No active comments. Toggle to show resolved comments.'
                  : 'Select text and add a comment to start a discussion.'}
              </p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <CommentThread
                key={thread.id}
                thread={thread}
                currentUserId={currentUserId}
                onReply={onReply}
                onResolve={onResolve}
                onUnresolve={onUnresolve}
                onDelete={onDelete}
                onEdit={onEdit}
                onClick={() => onThreadClick?.(thread.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
