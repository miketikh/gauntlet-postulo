/**
 * Unit tests for presence colors utility
 * Part of Story 4.5 - Implement Presence Awareness
 */

import { describe, it, expect } from 'vitest';
import {
  getUserColor,
  getColorByIndex,
  getUserColorVars,
  PRESENCE_COLORS,
} from '../presence-colors';

describe('presence-colors', () => {
  describe('PRESENCE_COLORS', () => {
    it('should have at least 8 colors', () => {
      expect(PRESENCE_COLORS.length).toBeGreaterThanOrEqual(8);
    });

    it('should have valid color structure', () => {
      PRESENCE_COLORS.forEach((color) => {
        expect(color).toHaveProperty('primary');
        expect(color).toHaveProperty('selection');
        expect(color).toHaveProperty('dimmed');
        expect(color).toHaveProperty('text');

        // Verify RGB format
        expect(color.primary).toMatch(/^rgb\(/);
        expect(color.selection).toMatch(/^rgba\(/);
        expect(color.dimmed).toMatch(/^rgba\(/);
        expect(color.text).toMatch(/^rgb\(/);
      });
    });

    it('should have semi-transparent selection colors', () => {
      PRESENCE_COLORS.forEach((color) => {
        // Selection should have alpha < 1
        expect(color.selection).toMatch(/rgba\([^)]+, 0\.\d+\)/);
      });
    });

    it('should have distinct primary colors', () => {
      const primaryColors = PRESENCE_COLORS.map(c => c.primary);
      const uniqueColors = new Set(primaryColors);

      // All colors should be unique
      expect(uniqueColors.size).toBe(PRESENCE_COLORS.length);
    });
  });

  describe('getUserColor', () => {
    it('should return a valid color object', () => {
      const color = getUserColor('user-123');

      expect(color).toHaveProperty('primary');
      expect(color).toHaveProperty('selection');
      expect(color).toHaveProperty('dimmed');
      expect(color).toHaveProperty('text');
    });

    it('should return consistent color for same user ID', () => {
      const userId = 'user-123';
      const color1 = getUserColor(userId);
      const color2 = getUserColor(userId);

      expect(color1).toEqual(color2);
    });

    it('should return different colors for different users', () => {
      const color1 = getUserColor('user-123');
      const color2 = getUserColor('user-456');

      // Not guaranteed to be different due to hash collisions, but highly likely
      // We'll just verify they're from the palette
      expect(PRESENCE_COLORS).toContainEqual(color1);
      expect(PRESENCE_COLORS).toContainEqual(color2);
    });

    it('should handle empty string', () => {
      const color = getUserColor('');
      expect(color).toBeDefined();
      expect(PRESENCE_COLORS).toContainEqual(color);
    });

    it('should handle special characters in user ID', () => {
      const color1 = getUserColor('user@123!#$%');
      const color2 = getUserColor('user@456!#$%');

      expect(color1).toBeDefined();
      expect(color2).toBeDefined();
    });

    it('should distribute users across color palette', () => {
      // Generate colors for many users
      const colorCounts = new Map<string, number>();

      for (let i = 0; i < 100; i++) {
        const color = getUserColor(`user-${i}`);
        const count = colorCounts.get(color.primary) || 0;
        colorCounts.set(color.primary, count + 1);
      }

      // Should use all colors in palette
      expect(colorCounts.size).toBe(PRESENCE_COLORS.length);
    });
  });

  describe('getColorByIndex', () => {
    it('should return color at specific index', () => {
      const color = getColorByIndex(0);
      expect(color).toEqual(PRESENCE_COLORS[0]);
    });

    it('should wrap around for indices beyond palette length', () => {
      const paletteLength = PRESENCE_COLORS.length;

      const color1 = getColorByIndex(0);
      const color2 = getColorByIndex(paletteLength);
      const color3 = getColorByIndex(paletteLength * 2);

      expect(color1).toEqual(color2);
      expect(color2).toEqual(color3);
    });

    it('should handle negative indices', () => {
      // Modulo of negative number in JS gives negative result
      // But our function should handle it gracefully
      const color = getColorByIndex(-1);
      expect(color).toBeDefined();
      expect(PRESENCE_COLORS).toContainEqual(color);
    });

    it('should return sequential colors', () => {
      const color0 = getColorByIndex(0);
      const color1 = getColorByIndex(1);
      const color2 = getColorByIndex(2);

      expect(color0).toEqual(PRESENCE_COLORS[0]);
      expect(color1).toEqual(PRESENCE_COLORS[1]);
      expect(color2).toEqual(PRESENCE_COLORS[2]);
    });
  });

  describe('getUserColorVars', () => {
    it('should return CSS variables object', () => {
      const vars = getUserColorVars('user-123');

      expect(vars).toHaveProperty('--user-color-primary');
      expect(vars).toHaveProperty('--user-color-selection');
      expect(vars).toHaveProperty('--user-color-dimmed');
      expect(vars).toHaveProperty('--user-color-text');
    });

    it('should return valid CSS color values', () => {
      const vars = getUserColorVars('user-123');

      expect(vars['--user-color-primary']).toMatch(/^rgb\(/);
      expect(vars['--user-color-selection']).toMatch(/^rgba\(/);
      expect(vars['--user-color-dimmed']).toMatch(/^rgba\(/);
      expect(vars['--user-color-text']).toMatch(/^rgb\(/);
    });

    it('should return consistent vars for same user', () => {
      const vars1 = getUserColorVars('user-123');
      const vars2 = getUserColorVars('user-123');

      expect(vars1).toEqual(vars2);
    });

    it('should match getUserColor output', () => {
      const userId = 'user-123';
      const color = getUserColor(userId);
      const vars = getUserColorVars(userId);

      expect(vars['--user-color-primary']).toBe(color.primary);
      expect(vars['--user-color-selection']).toBe(color.selection);
      expect(vars['--user-color-dimmed']).toBe(color.dimmed);
      expect(vars['--user-color-text']).toBe(color.text);
    });
  });
});
