/**
 * useScrollToCursor Hook
 * Utility for scrolling the editor to a specific cursor position
 * Part of Story 4.6 - Build Presence Indicator UI (Active Users List)
 */

'use client';

import { useCallback } from 'react';
import { RemoteUser } from './use-presence-awareness';

export interface UseScrollToCursorOptions {
  /**
   * Editor container element selector or ref
   */
  editorSelector?: string;

  /**
   * Scroll behavior
   */
  behavior?: ScrollBehavior;

  /**
   * Whether scrolling is enabled
   */
  enabled?: boolean;
}

export interface UseScrollToCursorReturn {
  /**
   * Scroll to a remote user's cursor position
   */
  scrollToUserCursor: (user: RemoteUser) => void;

  /**
   * Scroll to a specific position in the editor
   */
  scrollToPosition: (position: number) => void;
}

/**
 * Hook to scroll editor to cursor positions
 *
 * Features:
 * 1. Scrolls editor to remote user's cursor position
 * 2. Smooth scroll animation
 * 3. Works with Lexical editor DOM structure
 * 4. Handles edge cases (no cursor, invalid position)
 *
 * Note: This is a simplified implementation for Story 4.6.
 * A production implementation would need to:
 * - Map Yjs text offsets to exact DOM positions
 * - Handle complex document structures (nested lists, tables)
 * - Account for images and non-text content
 * - Work with virtual scrolling for large documents
 */
export function useScrollToCursor({
  editorSelector = '.editor-content',
  behavior = 'smooth',
  enabled = true,
}: UseScrollToCursorOptions = {}): UseScrollToCursorReturn {
  /**
   * Scroll to a remote user's cursor position
   */
  const scrollToUserCursor = useCallback(
    (user: RemoteUser) => {
      if (!enabled) return;

      const cursor = user.state.cursor;
      if (!cursor) {
        console.warn('User has no cursor position', user.state.user.name);
        return;
      }

      // Find the editor container
      const editorContainer = document.querySelector(editorSelector);
      if (!editorContainer) {
        console.warn('Editor container not found:', editorSelector);
        return;
      }

      // Try to find the cursor element created by PresencePlugin
      // Format: presence-cursor-{clientId}
      const cursorElement = document.getElementById(
        `presence-cursor-${user.clientId}`
      );

      if (cursorElement) {
        // Scroll the cursor element into view
        cursorElement.scrollIntoView({
          behavior,
          block: 'center',
          inline: 'nearest',
        });
      } else {
        // Fallback: Scroll based on position offset
        // This is a simplified approach - production would need proper position mapping
        scrollToPosition(cursor.anchor);
      }
    },
    [enabled, editorSelector, behavior]
  );

  /**
   * Scroll to a specific position in the editor
   * Note: Simplified implementation - maps position to approximate scroll location
   */
  const scrollToPosition = useCallback(
    (position: number) => {
      if (!enabled) return;

      const editorContainer = document.querySelector(editorSelector);
      if (!editorContainer) {
        console.warn('Editor container not found:', editorSelector);
        return;
      }

      // Get the editable content element
      const contentEditable = editorContainer.querySelector('[contenteditable="true"]');
      if (!contentEditable) {
        console.warn('Contenteditable element not found');
        return;
      }

      // Simplified approach: Calculate approximate scroll position
      // In a production app, you would:
      // 1. Walk the Lexical node tree to find the node at this position
      // 2. Get the DOM element for that node
      // 3. Scroll to that element

      const textContent = contentEditable.textContent || '';
      const totalLength = textContent.length;

      if (totalLength === 0) {
        return;
      }

      // Calculate percentage through document
      const percentage = Math.min(position / totalLength, 1);

      // Get editor scrollable height
      const scrollHeight = editorContainer.scrollHeight;
      const clientHeight = editorContainer.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      // Calculate target scroll position
      const targetScroll = maxScroll * percentage;

      // Scroll to position
      editorContainer.scrollTo({
        top: targetScroll,
        behavior,
      });
    },
    [enabled, editorSelector, behavior]
  );

  return {
    scrollToUserCursor,
    scrollToPosition,
  };
}
