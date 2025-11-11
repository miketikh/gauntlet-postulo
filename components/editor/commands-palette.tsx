/**
 * Commands Palette Component
 * Command palette for keyboard shortcuts and quick actions
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/utils';
import {
  Search,
  Save,
  Download,
  Share2,
  PanelLeftClose,
  PanelRightClose,
  MessageSquare,
  Users,
  History,
  FileText,
  Eye,
  Edit,
  Command,
} from 'lucide-react';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onExecute: () => void;
  category?: 'editor' | 'navigation' | 'view' | 'actions';
}

export interface CommandsPaletteProps {
  /**
   * Whether the palette is open
   */
  isOpen: boolean;

  /**
   * Callback to close the palette
   */
  onClose: () => void;

  /**
   * Available commands
   */
  commands: CommandAction[];

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Command palette for quick actions and keyboard shortcuts
 *
 * Features:
 * - Fuzzy search for commands
 * - Keyboard navigation (arrow keys, Enter)
 * - Categorized commands
 * - Keyboard shortcut display
 * - Quick access with Ctrl+K / Cmd+K
 */
export function CommandsPalette({
  isOpen,
  onClose,
  commands,
  className,
}: CommandsPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<CommandAction[]>(commands);

  // Filter commands based on search
  useEffect(() => {
    if (!search) {
      setFilteredCommands(commands);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.category?.toLowerCase().includes(searchLower)
    );

    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [search, commands]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onExecute();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'editor':
        return 'Editor';
      case 'navigation':
        return 'Navigation';
      case 'view':
        return 'View';
      case 'actions':
        return 'Actions';
      default:
        return 'Other';
    }
  };

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn('max-w-2xl p-0', className)}>
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Command className="h-4 w-4" />
            Commands
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Commands list */}
        <ScrollArea className="max-h-[400px]">
          <div className="px-2 pb-4">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No commands found
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {getCategoryLabel(category)}
                  </div>
                  <div className="space-y-1">
                    {cmds.map((cmd, index) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.onExecute();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                            isSelected
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/50'
                          )}
                        >
                          {cmd.icon && (
                            <div className="flex-shrink-0 w-4 h-4">
                              {cmd.icon}
                            </div>
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {cmd.description}
                              </div>
                            )}
                          </div>
                          {cmd.shortcut && (
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer with hint */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Use arrow keys to navigate, Enter to select, Esc to close</span>
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
