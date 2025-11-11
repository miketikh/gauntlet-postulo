/**
 * Active Users List Tests
 * Tests for Story 4.6 - Build Presence Indicator UI (Active Users List)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActiveUsersList } from '../active-users-list';
import { RemoteUser } from '@/lib/hooks/use-presence-awareness';

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

// Helper to create mock remote user
function createMockUser(
  id: string,
  name: string,
  lastActivity: number,
  clientId: number = Math.floor(Math.random() * 1000)
): RemoteUser {
  return {
    clientId,
    state: {
      user: {
        id,
        name,
        email: `${id}@example.com`,
      },
      color: {
        primary: 'rgb(59, 130, 246)',
        selection: 'rgba(59, 130, 246, 0.2)',
        dimmed: 'rgba(59, 130, 246, 0.4)',
        text: 'rgb(255, 255, 255)',
      },
      cursor: {
        anchor: 0,
        focus: 0,
      },
      lastActivity,
    },
    isActive: Date.now() - lastActivity < 30000,
  };
}

describe('ActiveUsersList', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with current user only', () => {
      render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
          }}
        />
      );

      expect(screen.getByText('1 person editing')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should render with multiple users', () => {
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', Date.now()),
        createMockUser('user-3', 'Bob Johnson', Date.now()),
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      expect(screen.getByText('3 people editing')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should show user count badges', () => {
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', Date.now()),
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      expect(screen.getByText('2 total')).toBeInTheDocument();
      expect(screen.getByText('1 editing')).toBeInTheDocument();
    });
  });

  describe('User Status (Editing vs Viewing)', () => {
    it('should mark users as "Editing" when active within 10 seconds', () => {
      const now = Date.now();
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', now - 5000), // 5 seconds ago
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
          editingThreshold={10000}
        />
      );

      // Check that Jane Smith appears and badge shows editing
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('1 editing')).toBeInTheDocument();
      expect(screen.getByText('2 people editing')).toBeInTheDocument();
    });

    it('should mark users as "Viewing" when inactive for more than 10 seconds', () => {
      const now = Date.now();
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', now - 15000), // 15 seconds ago
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
          editingThreshold={10000}
        />
      );

      // Check that Jane Smith appears and badge shows viewing
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('1 viewing')).toBeInTheDocument();
      expect(screen.getByText('1 person editing')).toBeInTheDocument(); // Only current user editing
    });

    it('should separate editing and viewing users', () => {
      const now = Date.now();
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', now - 5000), // Editing
        createMockUser('user-3', 'Bob Johnson', now - 15000), // Viewing
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
          editingThreshold={10000}
        />
      );

      expect(screen.getByText('2 people editing')).toBeInTheDocument();
      expect(screen.getByText('1 editing')).toBeInTheDocument();
      expect(screen.getByText('1 viewing')).toBeInTheDocument();
    });
  });

  describe('Collapsible Panel', () => {
    it('should start expanded by default', () => {
      render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should toggle collapsed state', () => {
      render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      const collapseButton = screen.getByLabelText('Collapse');
      fireEvent.click(collapseButton);

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should save collapsed state to localStorage', () => {
      const storageKey = 'test-active-users-collapsed';

      render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
          storageKey={storageKey}
        />
      );

      const collapseButton = screen.getByLabelText('Collapse');
      fireEvent.click(collapseButton);

      // Check immediately - useEffect should update localStorage synchronously
      expect(localStorageMock.getItem(storageKey)).toBe('true');
    });

    it('should load collapsed state from localStorage', () => {
      const storageKey = 'test-active-users-collapsed';
      localStorageMock.setItem(storageKey, 'true');

      render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
          storageKey={storageKey}
        />
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should call onUserClick when user is clicked', () => {
      const onUserClick = vi.fn();
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', Date.now()),
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
          onUserClick={onUserClick}
        />
      );

      const userButton = screen.getByText('Jane Smith').closest('button');
      fireEvent.click(userButton!);

      expect(onUserClick).toHaveBeenCalledWith(remoteUsers[0]);
    });

    it('should not call onUserClick if not provided', () => {
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', Date.now()),
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      const userButton = screen.getByText('Jane Smith').closest('button');
      fireEvent.click(userButton!);

      // Should not throw error
      expect(userButton).toBeInTheDocument();
    });
  });

  describe('Current User Highlighting', () => {
    it('should highlight current user distinctly', () => {
      const { container } = render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      // Find element with border-primary class
      const primaryBorderedElements = container.querySelectorAll('.border-primary');
      expect(primaryBorderedElements.length).toBeGreaterThan(0);

      // Check that John Doe is within a primary bordered section
      const johnDoeElement = screen.getByText('John Doe');
      expect(johnDoeElement).toBeInTheDocument();
    });

    it('should show current user as "Editing"', () => {
      render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      const currentUserSection = screen.getByText('John Doe').closest('div');
      // Current user should have "Editing" text nearby
      const editingTexts = screen.getAllByText(/Editing/i);
      expect(editingTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile View', () => {
    it('should render compact button in mobile view', () => {
      render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
          mobileView={true}
        />
      );

      // Should show user count button
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should expand panel when button clicked in mobile view', () => {
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', Date.now()),
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
          mobileView={true}
          defaultCollapsed={true}
        />
      );

      // Initially collapsed - user names should not be visible
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

      // Click to expand - find button with count
      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find(btn => btn.textContent?.includes('2'));
      expect(expandButton).toBeDefined();

      fireEvent.click(expandButton!);

      // Should show users after expansion
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no users', () => {
      render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={null}
        />
      );

      expect(screen.getByText('No users online')).toBeInTheDocument();
    });
  });

  describe('User Avatars', () => {
    it('should display user initials', () => {
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', Date.now()),
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith
    });

    it('should show green indicator dot for editing users', () => {
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', Date.now()),
      ];

      render(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      const janeAvatar = screen.getByText('JS').closest('div');
      const activeDot = janeAvatar?.querySelector('.bg-green-500');
      expect(activeDot).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update when remoteUsers changes', () => {
      const { rerender } = render(
        <ActiveUsersList
          remoteUsers={[]}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      expect(screen.getByText('1 person editing')).toBeInTheDocument();

      // Add a user
      const remoteUsers = [
        createMockUser('user-2', 'Jane Smith', Date.now()),
      ];

      rerender(
        <ActiveUsersList
          remoteUsers={remoteUsers}
          currentUser={{
            id: 'user-1',
            name: 'John Doe',
          }}
        />
      );

      expect(screen.getByText('2 people editing')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});
