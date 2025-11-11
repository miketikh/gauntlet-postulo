/**
 * Comment Thread Component
 * Displays a single comment thread with all replies
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

'use client';

import React, { useState } from 'react';
import { CommentThread as CommentThreadType, CommentWithAuthor } from '@/lib/types/comment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare,
  Reply,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils/utils';

export interface CommentThreadProps {
  thread: CommentThreadType;
  currentUserId?: string;
  onReply?: (threadId: string, content: string) => Promise<void>;
  onResolve?: (threadId: string) => Promise<void>;
  onUnresolve?: (threadId: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onClick?: () => void;
}

/**
 * Single comment component
 */
function CommentItem({
  comment,
  isAuthor,
  onDelete,
  onEdit,
}: {
  comment: CommentWithAuthor;
  isAuthor: boolean;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent);
      setIsEditing(false);
    }
  };

  const initials = `${comment.author.firstName[0]}${comment.author.lastName[0]}`.toUpperCase();

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.author.firstName} {comment.author.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          {isAuthor && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Comment thread component showing all comments in a thread
 */
export function CommentThread({
  thread,
  currentUserId,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
  onEdit,
  onClick,
}: CommentThreadProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return;

    setIsSubmitting(true);
    try {
      await onReply(thread.id, replyContent);
      setReplyContent('');
      setShowReplyBox(false);
    } catch (error) {
      console.error('Failed to reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (thread.resolved && onUnresolve) {
      await onUnresolve(thread.id);
    } else if (!thread.resolved && onResolve) {
      await onResolve(thread.id);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (onDelete) {
      await onDelete(commentId);
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    if (onEdit) {
      await onEdit(commentId, content);
    }
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4 space-y-4 hover:border-primary/50 transition-colors cursor-pointer',
        thread.resolved && 'opacity-60'
      )}
      onClick={onClick}
    >
      {/* Thread header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {thread.comments.length} {thread.comments.length === 1 ? 'comment' : 'comments'}
            </span>
            {thread.resolved && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Resolved
              </span>
            )}
          </div>

          {thread.textSnippet && (
            <div className="bg-muted rounded px-2 py-1">
              <p className="text-xs italic text-muted-foreground line-clamp-2">
                "{thread.textSnippet}"
              </p>
            </div>
          )}
        </div>

        <Button
          variant={thread.resolved ? 'outline' : 'default'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleResolve();
          }}
        >
          {thread.resolved ? 'Reopen' : 'Resolve'}
        </Button>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        {thread.comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isAuthor={comment.authorId === currentUserId}
            onDelete={() => handleDelete(comment.id)}
            onEdit={(content) => handleEdit(comment.id, content)}
          />
        ))}
      </div>

      {/* Reply section */}
      {!thread.resolved && (
        <div className="space-y-2 pt-2 border-t">
          {showReplyBox ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                className="text-sm"
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyContent('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowReplyBox(true);
              }}
              className="w-full justify-start"
            >
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
