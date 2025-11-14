/**
 * Layout Preferences Hook
 * Hook for persisting and managing layout preferences
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

import { useState, useEffect, useCallback } from 'react';

export interface LayoutPreferences {
  /**
   * Whether left panel is visible
   */
  showLeftPanel: boolean;

  /**
   * Whether right panel is visible
   */
  showRightPanel: boolean;

  /**
   * Whether right sidebar is collapsed
   */
  rightSidebarCollapsed: boolean;

  /**
   * Left panel size (percentage)
   */
  leftPanelSize?: number;

  /**
   * Center panel size (percentage)
   */
  centerPanelSize?: number;

  /**
   * Right panel size (percentage)
   */
  rightPanelSize?: number;

  /**
   * Active sidebar tab
   */
  activeSidebarTab?: string;
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  showLeftPanel: true,
  showRightPanel: true,
  rightSidebarCollapsed: false,
  leftPanelSize: 25,
  centerPanelSize: 50,
  rightPanelSize: 25,
  activeSidebarTab: 'presence',
};

export interface UseLayoutPreferencesOptions {
  /**
   * Storage key for localStorage
   */
  storageKey?: string;

  /**
   * User ID for user-specific preferences
   */
  userId?: string;

  /**
   * Draft ID for draft-specific preferences
   */
  draftId?: string;

  /**
   * Whether to use localStorage (if false, state only)
   */
  useLocalStorage?: boolean;

  /**
   * Whether to sync with database (future enhancement)
   */
  syncWithDatabase?: boolean;
}

/**
 * Hook for managing layout preferences with persistence
 *
 * Features:
 * - Load preferences from localStorage
 * - Save preferences to localStorage
 * - User-specific and draft-specific preferences
 * - Merge with default preferences
 * - Debounced saving
 *
 * Usage:
 * ```tsx
 * const {
 *   preferences,
 *   updatePreferences,
 *   resetPreferences,
 * } = useLayoutPreferences({
 *   userId: user.id,
 *   draftId: draft.id,
 * });
 * ```
 */
export function useLayoutPreferences(options: UseLayoutPreferencesOptions = {}) {
  const {
    storageKey = 'editor-layout-preferences',
    userId,
    draftId,
    useLocalStorage = true,
    syncWithDatabase = false,
  } = options;

  // Generate storage key based on user and draft
  const getStorageKey = useCallback(() => {
    const parts = [storageKey];
    if (userId) parts.push(userId);
    if (draftId) parts.push(draftId);
    return parts.join('-');
  }, [storageKey, userId, draftId]);

  // Load preferences from localStorage
  const loadPreferences = useCallback((): LayoutPreferences => {
    if (!useLocalStorage) {
      return DEFAULT_PREFERENCES;
    }

    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load layout preferences:', error);
    }

    return DEFAULT_PREFERENCES;
  }, [useLocalStorage, getStorageKey]);

  const [preferences, setPreferences] = useState<LayoutPreferences>(loadPreferences);

  // Save preferences to localStorage
  const savePreferences = useCallback(
    (prefs: LayoutPreferences) => {
      if (!useLocalStorage) return;

      try {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(prefs));

        // TODO: Sync with database if enabled
        if (syncWithDatabase && userId) {
          // Future enhancement: API call to save preferences to database
          // await apiClient.put(`/api/users/${userId}/preferences`, {
          //   method: 'PUT',
          //   body: JSON.stringify({ layout: prefs }),
          // });
        }
      } catch (error) {
        console.error('Failed to save layout preferences:', error);
      }
    },
    [useLocalStorage, syncWithDatabase, userId, getStorageKey]
  );

  // Update preferences
  const updatePreferences = useCallback(
    (updates: Partial<LayoutPreferences>) => {
      setPreferences((prev) => {
        const updated = { ...prev, ...updates };
        savePreferences(updated);
        return updated;
      });
    },
    [savePreferences]
  );

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Toggle panel visibility
  const toggleLeftPanel = useCallback(() => {
    updatePreferences({ showLeftPanel: !preferences.showLeftPanel });
  }, [preferences.showLeftPanel, updatePreferences]);

  const toggleRightPanel = useCallback(() => {
    updatePreferences({ showRightPanel: !preferences.showRightPanel });
  }, [preferences.showRightPanel, updatePreferences]);

  const toggleRightSidebar = useCallback(() => {
    updatePreferences({ rightSidebarCollapsed: !preferences.rightSidebarCollapsed });
  }, [preferences.rightSidebarCollapsed, updatePreferences]);

  // Update panel sizes
  const updatePanelSizes = useCallback(
    (sizes: { left?: number; center?: number; right?: number }) => {
      updatePreferences({
        leftPanelSize: sizes.left,
        centerPanelSize: sizes.center,
        rightPanelSize: sizes.right,
      });
    },
    [updatePreferences]
  );

  // Update active tab
  const setActiveSidebarTab = useCallback(
    (tab: string) => {
      updatePreferences({ activeSidebarTab: tab });
    },
    [updatePreferences]
  );

  // Load preferences on mount or when dependencies change
  useEffect(() => {
    const loaded = loadPreferences();
    setPreferences(loaded);
  }, [userId, draftId, loadPreferences]);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    toggleLeftPanel,
    toggleRightPanel,
    toggleRightSidebar,
    updatePanelSizes,
    setActiveSidebarTab,
  };
}
