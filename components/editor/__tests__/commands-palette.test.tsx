/**
 * Commands Palette Tests
 * Tests for the keyboard commands palette
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandsPalette } from '../commands-palette';
import { Save, Download } from 'lucide-react';

describe('CommandsPalette', () => {
  const mockOnClose = vi.fn();
  const mockCommand1 = vi.fn();
  const mockCommand2 = vi.fn();

  const mockCommands = [
    {
      id: 'save',
      label: 'Save Document',
      description: 'Save the current draft',
      icon: <Save className="h-4 w-4" />,
      shortcut: '⌘+S',
      onExecute: mockCommand1,
      category: 'editor' as const,
    },
    {
      id: 'export',
      label: 'Export to Word',
      description: 'Export as .docx',
      icon: <Download className="h-4 w-4" />,
      shortcut: '⌘+E',
      onExecute: mockCommand2,
      category: 'actions' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    expect(screen.getByText('Commands')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <CommandsPalette
        isOpen={false}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    expect(screen.queryByText('Commands')).not.toBeInTheDocument();
  });

  it('displays all commands', () => {
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    expect(screen.getByText('Save Document')).toBeInTheDocument();
    expect(screen.getByText('Export to Word')).toBeInTheDocument();
  });

  it('filters commands based on search', async () => {
    const user = userEvent.setup();
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    await user.type(searchInput, 'save');

    await waitFor(() => {
      expect(screen.getByText('Save Document')).toBeInTheDocument();
      expect(screen.queryByText('Export to Word')).not.toBeInTheDocument();
    });
  });

  it('executes command on click', async () => {
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    const saveButton = screen.getByText('Save Document');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCommand1).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('executes command with Enter key', async () => {
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockCommand1).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates with arrow keys', async () => {
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    const searchInput = screen.getByPlaceholderText('Type a command or search...');

    // Press down arrow
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    // Press Enter to execute second command
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockCommand2).toHaveBeenCalledTimes(1);
    });
  });

  it('closes with Escape key', () => {
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.keyDown(searchInput, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays keyboard shortcuts', () => {
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    expect(screen.getByText('⌘+S')).toBeInTheDocument();
    expect(screen.getByText('⌘+E')).toBeInTheDocument();
  });

  it('groups commands by category', () => {
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('shows empty state when no commands match search', async () => {
    const user = userEvent.setup();
    render(
      <CommandsPalette
        isOpen={true}
        onClose={mockOnClose}
        commands={mockCommands}
      />
    );

    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText('No commands found')).toBeInTheDocument();
    });
  });
});
