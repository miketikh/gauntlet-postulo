/**
 * Presence Indicator Components
 * UI components for displaying remote user presence
 * Part of Story 4.5 - Implement Presence Awareness (Story 4.6 - Active Users List)
 */

'use client';

import React from 'react';
import { RemoteUser } from '@/lib/hooks/use-presence-awareness';
import { cn } from '@/lib/utils/utils';
import { User, Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface PresenceIndicatorProps {
  /**
   * List of remote users currently present
   */
  remoteUsers: RemoteUser[];

  /**
   * Current user's name (to exclude from display)
   */
  currentUserName?: string;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Callback when user avatar is clicked (optional)
   */
  onUserClick?: (user: RemoteUser) => void;
}

/**
 * Compact presence indicator showing active users
 * Displays user count and avatars
 */
export function PresenceIndicator({
  remoteUsers,
  currentUserName,
  className,
  onUserClick,
}: PresenceIndicatorProps) {
  const activeUsers = remoteUsers.filter(u => u.isActive);
  const inactiveUsers = remoteUsers.filter(u => !u.isActive);

  if (remoteUsers.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* User count */}
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          {remoteUsers.length + 1} {remoteUsers.length === 0 ? 'person' : 'people'}
        </span>
      </div>

      {/* User avatars */}
      <div className="flex -space-x-2">
        {activeUsers.map((remoteUser) => (
          <UserAvatar
            key={remoteUser.clientId}
            remoteUser={remoteUser}
            onClick={onUserClick ? () => onUserClick(remoteUser) : undefined}
          />
        ))}
        {inactiveUsers.map((remoteUser) => (
          <UserAvatar
            key={remoteUser.clientId}
            remoteUser={remoteUser}
            inactive
            onClick={onUserClick ? () => onUserClick(remoteUser) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * User avatar with color badge and tooltip
 */
export function UserAvatar({
  remoteUser,
  inactive = false,
  onClick,
}: {
  remoteUser: RemoteUser;
  inactive?: boolean;
  onClick?: () => void;
}) {
  const { state } = remoteUser;
  const { user, color } = state;

  // Get user initials
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = inactive ? color.dimmed : color.primary;
  const opacity = inactive ? 'opacity-50' : '';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'relative inline-flex items-center justify-center',
              'h-8 w-8 rounded-full text-xs font-medium',
              'border-2 border-background',
              'transition-transform hover:scale-110 hover:z-10',
              opacity,
              onClick ? 'cursor-pointer' : 'cursor-default'
            )}
            style={{
              backgroundColor: avatarColor,
              color: color.text,
            }}
          >
            {initials}

            {/* Activity indicator dot */}
            {!inactive && (
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500"
                aria-label="Active"
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {inactive ? 'Viewing' : 'Editing'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Detailed presence list (for sidebar)
 */
export interface PresenceListProps {
  /**
   * List of remote users
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
   * Callback when user is clicked
   */
  onUserClick?: (user: RemoteUser) => void;
}

/**
 * Detailed list of active users (for sidebar or modal)
 */
export function PresenceList({
  remoteUsers,
  currentUser,
  className,
  onUserClick,
}: PresenceListProps) {
  const activeUsers = remoteUsers.filter(u => u.isActive);
  const inactiveUsers = remoteUsers.filter(u => !u.isActive);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Active Users</h3>
        <span className="text-xs text-muted-foreground">
          {remoteUsers.length + 1} total
        </span>
      </div>

      {/* Current user */}
      {currentUser && (
        <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">You</p>
          </div>
        </div>
      )}

      {/* Active remote users */}
      {activeUsers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Editing
          </p>
          {activeUsers.map((remoteUser) => (
            <UserListItem
              key={remoteUser.clientId}
              remoteUser={remoteUser}
              onClick={onUserClick}
            />
          ))}
        </div>
      )}

      {/* Inactive remote users */}
      {inactiveUsers.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Viewing
          </p>
          {inactiveUsers.map((remoteUser) => (
            <UserListItem
              key={remoteUser.clientId}
              remoteUser={remoteUser}
              inactive
              onClick={onUserClick}
            />
          ))}
        </div>
      )}

      {remoteUsers.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No other users online
        </div>
      )}
    </div>
  );
}

/**
 * User list item for presence list
 */
function UserListItem({
  remoteUser,
  inactive = false,
  onClick,
}: {
  remoteUser: RemoteUser;
  inactive?: boolean;
  onClick?: (user: RemoteUser) => void;
}) {
  const { state } = remoteUser;
  const { user, color } = state;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = inactive ? color.dimmed : color.primary;

  return (
    <button
      onClick={onClick ? () => onClick(remoteUser) : undefined}
      className={cn(
        'flex items-center space-x-3 p-2 rounded-lg w-full text-left',
        'transition-colors',
        onClick ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default'
      )}
    >
      <div
        className="flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium relative"
        style={{
          backgroundColor: avatarColor,
          color: color.text,
        }}
      >
        {initials}
        {!inactive && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background bg-green-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        {user.email && (
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        )}
      </div>
    </button>
  );
}
