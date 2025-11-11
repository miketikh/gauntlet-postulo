/**
 * Layout Preferences Hook Tests
 * Tests for the layout preferences persistence hook
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayoutPreferences } from '../use-layout-preferences';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useLayoutPreferences', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns default preferences on first load', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    expect(result.current.preferences).toEqual({
      showLeftPanel: true,
      showRightPanel: true,
      rightSidebarCollapsed: false,
      leftPanelSize: 25,
      centerPanelSize: 50,
      rightPanelSize: 25,
      activeSidebarTab: 'presence',
    });
  });

  it('updates preferences', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    act(() => {
      result.current.updatePreferences({ showLeftPanel: false });
    });

    expect(result.current.preferences.showLeftPanel).toBe(false);
  });

  it('persists preferences to localStorage', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    act(() => {
      result.current.updatePreferences({ showLeftPanel: false });
    });

    const stored = localStorageMock.getItem('editor-layout-preferences');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.showLeftPanel).toBe(false);
  });

  it('loads preferences from localStorage', () => {
    // Pre-populate localStorage
    localStorageMock.setItem(
      'editor-layout-preferences',
      JSON.stringify({
        showLeftPanel: false,
        showRightPanel: false,
        rightSidebarCollapsed: true,
      })
    );

    const { result } = renderHook(() => useLayoutPreferences());

    expect(result.current.preferences.showLeftPanel).toBe(false);
    expect(result.current.preferences.showRightPanel).toBe(false);
    expect(result.current.preferences.rightSidebarCollapsed).toBe(true);
  });

  it('toggles left panel', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    act(() => {
      result.current.toggleLeftPanel();
    });

    expect(result.current.preferences.showLeftPanel).toBe(false);

    act(() => {
      result.current.toggleLeftPanel();
    });

    expect(result.current.preferences.showLeftPanel).toBe(true);
  });

  it('toggles right panel', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    act(() => {
      result.current.toggleRightPanel();
    });

    expect(result.current.preferences.showRightPanel).toBe(false);
  });

  it('toggles right sidebar', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    act(() => {
      result.current.toggleRightSidebar();
    });

    expect(result.current.preferences.rightSidebarCollapsed).toBe(true);
  });

  it('updates panel sizes', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    act(() => {
      result.current.updatePanelSizes({
        left: 30,
        center: 40,
        right: 30,
      });
    });

    expect(result.current.preferences.leftPanelSize).toBe(30);
    expect(result.current.preferences.centerPanelSize).toBe(40);
    expect(result.current.preferences.rightPanelSize).toBe(30);
  });

  it('sets active sidebar tab', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    act(() => {
      result.current.setActiveSidebarTab('comments');
    });

    expect(result.current.preferences.activeSidebarTab).toBe('comments');
  });

  it('resets preferences to defaults', () => {
    const { result } = renderHook(() => useLayoutPreferences());

    act(() => {
      result.current.updatePreferences({
        showLeftPanel: false,
        showRightPanel: false,
      });
    });

    expect(result.current.preferences.showLeftPanel).toBe(false);

    act(() => {
      result.current.resetPreferences();
    });

    expect(result.current.preferences.showLeftPanel).toBe(true);
    expect(result.current.preferences.showRightPanel).toBe(true);
  });

  it('uses custom storage key', () => {
    const { result } = renderHook(() =>
      useLayoutPreferences({ storageKey: 'custom-key' })
    );

    act(() => {
      result.current.updatePreferences({ showLeftPanel: false });
    });

    const stored = localStorageMock.getItem('custom-key');
    expect(stored).toBeTruthy();
  });

  it('includes userId in storage key', () => {
    const { result } = renderHook(() =>
      useLayoutPreferences({ userId: 'user-123' })
    );

    act(() => {
      result.current.updatePreferences({ showLeftPanel: false });
    });

    const stored = localStorageMock.getItem('editor-layout-preferences-user-123');
    expect(stored).toBeTruthy();
  });

  it('includes draftId in storage key', () => {
    const { result } = renderHook(() =>
      useLayoutPreferences({ userId: 'user-123', draftId: 'draft-456' })
    );

    act(() => {
      result.current.updatePreferences({ showLeftPanel: false });
    });

    const stored = localStorageMock.getItem(
      'editor-layout-preferences-user-123-draft-456'
    );
    expect(stored).toBeTruthy();
  });

  it('does not use localStorage when disabled', () => {
    const { result } = renderHook(() =>
      useLayoutPreferences({ useLocalStorage: false })
    );

    act(() => {
      result.current.updatePreferences({ showLeftPanel: false });
    });

    const stored = localStorageMock.getItem('editor-layout-preferences');
    expect(stored).toBeNull();
  });

  it('merges loaded preferences with defaults', () => {
    // Pre-populate with partial preferences
    localStorageMock.setItem(
      'editor-layout-preferences',
      JSON.stringify({
        showLeftPanel: false,
      })
    );

    const { result } = renderHook(() => useLayoutPreferences());

    expect(result.current.preferences.showLeftPanel).toBe(false);
    expect(result.current.preferences.showRightPanel).toBe(true); // Default value
    expect(result.current.preferences.leftPanelSize).toBe(25); // Default value
  });
});
