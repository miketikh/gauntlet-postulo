/**
 * Comment Types
 * TypeScript interfaces for comment threads on text selections
 * Part of Story 4.7 - Implement Comment Threads on Text Selections
 */

import { Comment as DbComment } from '@/lib/db/schema';

/**
 * Position range for a text selection
 */
export interface TextSelection {
  start: number;
  end: number;
}

/**
 * Comment author information
 */
export interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Comment with author details
 */
export interface CommentWithAuthor extends DbComment {
  author: CommentAuthor;
}

/**
 * Comment thread (group of comments with same threadId)
 */
export interface CommentThread {
  id: string; // threadId
  draftId: string;
  selection: TextSelection;
  textSnippet: string;
  resolved: boolean;
  comments: CommentWithAuthor[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request payload for creating a comment
 */
export interface CreateCommentRequest {
  content: string;
  selectionStart: number;
  selectionEnd: number;
  textSnippet?: string;
  threadId?: string; // Optional: if replying to existing thread
}

/**
 * Request payload for updating a comment
 */
export interface UpdateCommentRequest {
  content?: string;
  resolved?: boolean;
}

/**
 * Comment highlight decoration data
 */
export interface CommentHighlight {
  threadId: string;
  start: number;
  end: number;
  resolved: boolean;
  color: string;
}

/**
 * WebSocket message for real-time comment updates
 */
export interface CommentWebSocketMessage {
  type: 'comment:created' | 'comment:updated' | 'comment:resolved';
  draftId: string;
  threadId: string;
  comment?: CommentWithAuthor;
  resolved?: boolean;
}

/**
 * Position update for comment tracking
 * Used when document content changes and comment positions need to be adjusted
 */
export interface CommentPositionUpdate {
  threadId: string;
  oldStart: number;
  oldEnd: number;
  newStart: number;
  newEnd: number;
}
