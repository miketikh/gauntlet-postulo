/**
 * Vitest setup file
 * Configures testing environment and global test utilities
 */

import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
