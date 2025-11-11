/**
 * Keyboard Shortcuts Hook
 * Hook for managing keyboard shortcuts in the editor
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  /**
   * Whether keyboard shortcuts are enabled
   */
  enabled?: boolean;

  /**
   * Whether to prevent default behavior
   */
  preventDefault?: boolean;

  /**
   * Whether to stop propagation
   */
  stopPropagation?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 *
 * Usage:
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 'k',
 *     metaKey: true,
 *     callback: () => openCommandsPalette(),
 *     description: 'Open commands palette'
 *   },
 *   {
 *     key: 's',
 *     metaKey: true,
 *     callback: () => save(),
 *     description: 'Save document'
 *   }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true, stopPropagation = false } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow some shortcuts even in inputs (like Cmd+K for commands)
        const isCommandKey = event.metaKey || event.ctrlKey;
        const isCommandsShortcut = event.key.toLowerCase() === 'k' && isCommandKey;
        if (!isCommandsShortcut) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey : true;
        const metaMatches = shortcut.metaKey ? event.metaKey : true;
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : true;
        const altMatches = shortcut.altKey ? event.altKey : true;

        // Check if modifier keys are NOT pressed when not required
        const ctrlNotPressed = !shortcut.ctrlKey ? !event.ctrlKey : true;
        const metaNotPressed = !shortcut.metaKey ? !event.metaKey : true;
        const shiftNotPressed = !shortcut.shiftKey ? !event.shiftKey : true;
        const altNotPressed = !shortcut.altKey ? !event.altKey : true;

        if (
          keyMatches &&
          ctrlMatches &&
          metaMatches &&
          shiftMatches &&
          altMatches &&
          ctrlNotPressed &&
          metaNotPressed &&
          shiftNotPressed &&
          altNotPressed
        ) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }

          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts, enabled, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.shiftKey) parts.push('⇧');
  if (shortcut.altKey) parts.push('⌥');

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}
