/**
 * Active Users List Component
 * Collapsible panel showing all connected users with editing/viewing status
 * Part of Story 4.6 - Build Presence Indicator UI (Active Users List)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RemoteUser } from '@/lib/hooks/use-presence-awareness';
import { cn } from '@/lib/utils/utils';
import {
  Users,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Circle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ActiveUsersListProps {
  /**
   * List of remote users currently present
   */
  remoteUsers: RemoteUser[];

  /**
   * Current user information
   */
  currentUser: {
    id: string;
    name: string;
    email?: string;
  } | null;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Callback when user avatar is clicked (for scroll-to-cursor)
   */
  onUserClick?: (user: RemoteUser) => void;

  /**
   * Whether the panel is initially collapsed
   */
  defaultCollapsed?: boolean;

  /**
   * Key for localStorage to persist collapsed state
   */
  storageKey?: string;

  /**
   * Show mobile-responsive view
   */
  mobileView?: boolean;

  /**
   * Activity threshold in milliseconds for "Editing" status (default: 10000 = 10 seconds)
   */
  editingThreshold?: number;
}

/**
 * Get user initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Determine if user is actively editing (activity within threshold)
 */
function isUserEditing(remoteUser: RemoteUser, threshold: number): boolean {
  const now = Date.now();
  return (now - remoteUser.state.lastActivity) < threshold;
}

/**
 * Active Users List with collapsible panel
 *
 * Features:
 * 1. Shows avatars/initials with color badges
 * 2. User count display: "3 people editing"
 * 3. Hover shows full name and online status
 * 4. Current user highlighted distinctly
 * 5. "Editing" (active in last 10s) vs "Viewing" status
 * 6. Real-time updates as users join/leave
 * 7. Optional click to scroll to cursor
 * 8. Collapsible with localStorage persistence
 * 9. Mobile-responsive (count only, expandable)
 */
export function ActiveUsersList({
  remoteUsers,
  currentUser,
  className,
  onUserClick,
  defaultCollapsed = false,
  storageKey = 'active-users-list-collapsed',
  mobileView = false,
  editingThreshold = 10000, // 10 seconds
}: ActiveUsersListProps) {
  // Load collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? stored === 'true' : defaultCollapsed;
    }
    return defaultCollapsed;
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, String(isCollapsed));
    }
  }, [isCollapsed, storageKey]);

  // Separate users by editing status
  const editingUsers = remoteUsers.filter(u => isUserEditing(u, editingThreshold));
  const viewingUsers = remoteUsers.filter(u => !isUserEditing(u, editingThreshold));

  const totalUsers = remoteUsers.length + (currentUser ? 1 : 0);
  const editingCount = editingUsers.length + (currentUser ? 1 : 0); // Assume current user is editing

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);

  // Mobile view - compact display
  if (mobileView) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleCollapsed}
          className="flex items-center space-x-2"
        >
          <Users className="h-4 w-4" />
          <span className="text-xs font-medium">{totalUsers}</span>
          {isCollapsed ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
        </Button>

        {/* Expandable panel on mobile */}
        {!isCollapsed && (
          <div className="absolute top-12 right-4 z-50 w-64">
            <Card>
              <CardContent className="p-4">
                <ActiveUsersContent
                  remoteUsers={remoteUsers}
                  currentUser={currentUser}
                  editingUsers={editingUsers}
                  viewingUsers={viewingUsers}
                  editingCount={editingCount}
                  totalUsers={totalUsers}
                  onUserClick={onUserClick}
                  editingThreshold={editingThreshold}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Desktop view - full panel
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">
              {editingCount === 1 ? '1 person editing' : `${editingCount} people editing`}
            </CardTitle>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="h-6 w-6 p-0"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User count badge */}
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {totalUsers} total
          </Badge>
          {editingUsers.length > 0 && (
            <Badge variant="default" className="text-xs">
              {editingUsers.length} editing
            </Badge>
          )}
          {viewingUsers.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {viewingUsers.length} viewing
            </Badge>
          )}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0 pb-4">
          <ActiveUsersContent
            remoteUsers={remoteUsers}
            currentUser={currentUser}
            editingUsers={editingUsers}
            viewingUsers={viewingUsers}
            editingCount={editingCount}
            totalUsers={totalUsers}
            onUserClick={onUserClick}
            editingThreshold={editingThreshold}
          />
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Content for active users list (shared between desktop and mobile)
 */
function ActiveUsersContent({
  remoteUsers,
  currentUser,
  editingUsers,
  viewingUsers,
  editingCount,
  totalUsers,
  onUserClick,
  editingThreshold,
}: {
  remoteUsers: RemoteUser[];
  currentUser: { id: string; name: string; email?: string } | null;
  editingUsers: RemoteUser[];
  viewingUsers: RemoteUser[];
  editingCount: number;
  totalUsers: number;
  onUserClick?: (user: RemoteUser) => void;
  editingThreshold: number;
}) {
  return (
    <div className="space-y-4">
      {/* Current user - highlighted */}
      {currentUser && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            You
          </p>
          <CurrentUserItem user={currentUser} />
        </div>
      )}

      {/* Editing users */}
      {editingUsers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            Editing
          </p>
          <div className="space-y-1">
            {editingUsers.map((remoteUser) => (
              <UserListItem
                key={remoteUser.clientId}
                remoteUser={remoteUser}
                status="editing"
                onClick={onUserClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Viewing users */}
      {viewingUsers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            Viewing
          </p>
          <div className="space-y-1">
            {viewingUsers.map((remoteUser) => (
              <UserListItem
                key={remoteUser.clientId}
                remoteUser={remoteUser}
                status="viewing"
                onClick={onUserClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {remoteUsers.length === 0 && !currentUser && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No users online</p>
        </div>
      )}
    </div>
  );
}

/**
 * Current user item (highlighted)
 */
function CurrentUserItem({
  user,
}: {
  user: { id: string; name: string; email?: string };
}) {
  const initials = getInitials(user.name);

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg bg-primary/10 border-2 border-primary">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground text-sm font-bold">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{user.name}</p>
        <div className="flex items-center space-x-1">
          <Circle className="h-2 w-2 fill-green-500 text-green-500" />
          <p className="text-xs text-muted-foreground">Editing</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Remote user list item
 */
function UserListItem({
  remoteUser,
  status,
  onClick,
}: {
  remoteUser: RemoteUser;
  status: 'editing' | 'viewing';
  onClick?: (user: RemoteUser) => void;
}) {
  const { state } = remoteUser;
  const { user, color } = state;

  const initials = getInitials(user.name);
  const isEditing = status === 'editing';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick ? () => onClick(remoteUser) : undefined}
            className={cn(
              'flex items-center space-x-3 p-2 rounded-lg w-full text-left',
              'transition-colors border border-transparent',
              onClick
                ? 'hover:bg-muted/50 hover:border-muted-foreground/20 cursor-pointer'
                : 'cursor-default',
              !isEditing && 'opacity-70'
            )}
          >
            <div
              className="flex items-center justify-center h-10 w-10 rounded-full text-sm font-semibold relative flex-shrink-0"
              style={{
                backgroundColor: color.primary,
                color: color.text,
              }}
            >
              {initials}
              {isEditing && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500"
                  aria-label="Active"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <div className="flex items-center space-x-1">
                <Circle
                  className={cn(
                    'h-2 w-2',
                    isEditing
                      ? 'fill-green-500 text-green-500'
                      : 'fill-gray-400 text-gray-400'
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {isEditing ? 'Editing' : 'Viewing'}
                </p>
              </div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <div className="space-y-1">
            <p className="font-medium">{user.name}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
            <p className="text-xs">
              Status:{' '}
              <span className={cn(
                'font-medium',
                isEditing ? 'text-green-500' : 'text-gray-400'
              )}>
                {isEditing ? 'Editing' : 'Viewing'}
              </span>
            </p>
            {onClick && (
              <p className="text-xs text-muted-foreground italic">
                Click to jump to cursor
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
