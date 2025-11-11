/**
 * Keyboard Shortcuts Hook Tests
 * Tests for the keyboard shortcuts hook
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut } from '../use-keyboard-shortcuts';

describe('useKeyboardShortcuts', () => {
  const mockCallback1 = vi.fn();
  const mockCallback2 = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', () => {});
  });

  it('calls callback when shortcut is triggered', () => {
    const shortcuts = [
      {
        key: 's',
        metaKey: true,
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Cmd+S
    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
    });
    document.dispatchEvent(event);

    expect(mockCallback1).toHaveBeenCalledTimes(1);
  });

  it('does not call callback when modifiers do not match', () => {
    const shortcuts = [
      {
        key: 's',
        metaKey: true,
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate just S (without Cmd)
    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: false,
    });
    document.dispatchEvent(event);

    expect(mockCallback1).not.toHaveBeenCalled();
  });

  it('handles multiple shortcuts', () => {
    const shortcuts = [
      {
        key: 's',
        metaKey: true,
        callback: mockCallback1,
      },
      {
        key: 'k',
        metaKey: true,
        callback: mockCallback2,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Trigger first shortcut
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', metaKey: true })
    );
    expect(mockCallback1).toHaveBeenCalledTimes(1);

    // Trigger second shortcut
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true })
    );
    expect(mockCallback2).toHaveBeenCalledTimes(1);
  });

  it('respects enabled option', () => {
    const shortcuts = [
      {
        key: 's',
        metaKey: true,
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, { enabled: false }));

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', metaKey: true })
    );

    expect(mockCallback1).not.toHaveBeenCalled();
  });

  it('prevents default when preventDefault is true', () => {
    const shortcuts = [
      {
        key: 's',
        metaKey: true,
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, { preventDefault: true }));

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not trigger shortcuts when typing in input', () => {
    const shortcuts = [
      {
        key: 'a',
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Create input element and set it as target
    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 'a' });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });

    document.dispatchEvent(event);

    expect(mockCallback1).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('allows Cmd+K even in inputs', () => {
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });

    document.dispatchEvent(event);

    expect(mockCallback1).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it('handles Ctrl key modifier', () => {
    const shortcuts = [
      {
        key: 's',
        ctrlKey: true,
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    );

    expect(mockCallback1).toHaveBeenCalledTimes(1);
  });

  it('handles Shift key modifier', () => {
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        shiftKey: true,
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, shiftKey: true })
    );

    expect(mockCallback1).toHaveBeenCalledTimes(1);
  });

  it('handles Alt key modifier', () => {
    const shortcuts = [
      {
        key: 'a',
        altKey: true,
        callback: mockCallback1,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', altKey: true })
    );

    expect(mockCallback1).toHaveBeenCalledTimes(1);
  });
});

describe('formatShortcut', () => {
  it('formats simple shortcut', () => {
    const shortcut = { key: 's', callback: () => {} };
    expect(formatShortcut(shortcut)).toBe('S');
  });

  it('formats shortcut with Cmd', () => {
    const shortcut = { key: 's', metaKey: true, callback: () => {} };
    expect(formatShortcut(shortcut)).toBe('⌘+S');
  });

  it('formats shortcut with Ctrl', () => {
    const shortcut = { key: 's', ctrlKey: true, callback: () => {} };
    expect(formatShortcut(shortcut)).toBe('Ctrl+S');
  });

  it('formats shortcut with Shift', () => {
    const shortcut = { key: 'k', shiftKey: true, callback: () => {} };
    expect(formatShortcut(shortcut)).toBe('⇧+K');
  });

  it('formats shortcut with Alt', () => {
    const shortcut = { key: 'a', altKey: true, callback: () => {} };
    expect(formatShortcut(shortcut)).toBe('⌥+A');
  });

  it('formats complex shortcut', () => {
    const shortcut = {
      key: 's',
      metaKey: true,
      shiftKey: true,
      callback: () => {},
    };
    expect(formatShortcut(shortcut)).toBe('⌘+⇧+S');
  });
});
