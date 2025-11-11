/**
 * Presence Color Palette
 * Provides distinct, accessible colors for user identification in collaborative editing
 * Part of Story 4.5 - Implement Presence Awareness
 */

export interface UserColor {
  /**
   * Primary color for cursor and strong accents
   */
  primary: string;

  /**
   * Semi-transparent color for text selection highlighting
   */
  selection: string;

  /**
   * Dimmed version for inactive users
   */
  dimmed: string;

  /**
   * High contrast color for text on the primary color
   */
  text: string;
}

/**
 * Predefined color palette for user presence indicators
 * 10 distinct, accessible colors optimized for both light and dark themes
 */
export const PRESENCE_COLORS: UserColor[] = [
  {
    primary: 'rgb(59, 130, 246)', // Blue
    selection: 'rgba(59, 130, 246, 0.2)',
    dimmed: 'rgba(59, 130, 246, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(16, 185, 129)', // Green
    selection: 'rgba(16, 185, 129, 0.2)',
    dimmed: 'rgba(16, 185, 129, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(245, 158, 11)', // Amber
    selection: 'rgba(245, 158, 11, 0.2)',
    dimmed: 'rgba(245, 158, 11, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(239, 68, 68)', // Red
    selection: 'rgba(239, 68, 68, 0.2)',
    dimmed: 'rgba(239, 68, 68, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(168, 85, 247)', // Purple
    selection: 'rgba(168, 85, 247, 0.2)',
    dimmed: 'rgba(168, 85, 247, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(236, 72, 153)', // Pink
    selection: 'rgba(236, 72, 153, 0.2)',
    dimmed: 'rgba(236, 72, 153, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(14, 165, 233)', // Sky
    selection: 'rgba(14, 165, 233, 0.2)',
    dimmed: 'rgba(14, 165, 233, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(34, 197, 94)', // Lime
    selection: 'rgba(34, 197, 94, 0.2)',
    dimmed: 'rgba(34, 197, 94, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(251, 146, 60)', // Orange
    selection: 'rgba(251, 146, 60, 0.2)',
    dimmed: 'rgba(251, 146, 60, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
  {
    primary: 'rgb(99, 102, 241)', // Indigo
    selection: 'rgba(99, 102, 241, 0.2)',
    dimmed: 'rgba(99, 102, 241, 0.4)',
    text: 'rgb(255, 255, 255)',
  },
];

/**
 * Assigns a consistent color to a user based on their ID
 * Same user ID always gets the same color (deterministic)
 *
 * @param userId - The user's unique ID
 * @returns UserColor object with primary, selection, dimmed, and text colors
 */
export function getUserColor(userId: string): UserColor {
  // Simple hash function to convert userId to a number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use modulo to map to color palette index
  const index = Math.abs(hash) % PRESENCE_COLORS.length;

  return PRESENCE_COLORS[index];
}

/**
 * Gets the next available color from the palette
 * Used when assigning colors sequentially (e.g., in order of connection)
 *
 * @param index - Sequential index (0-based)
 * @returns UserColor object
 */
export function getColorByIndex(index: number): UserColor {
  const positiveIndex = ((index % PRESENCE_COLORS.length) + PRESENCE_COLORS.length) % PRESENCE_COLORS.length;
  return PRESENCE_COLORS[positiveIndex];
}

/**
 * Generates CSS variables for a user's color
 * Useful for applying colors via CSS custom properties
 *
 * @param userId - The user's unique ID
 * @returns Object with CSS variable names and values
 */
export function getUserColorVars(userId: string): Record<string, string> {
  const color = getUserColor(userId);
  return {
    '--user-color-primary': color.primary,
    '--user-color-selection': color.selection,
    '--user-color-dimmed': color.dimmed,
    '--user-color-text': color.text,
  };
}
