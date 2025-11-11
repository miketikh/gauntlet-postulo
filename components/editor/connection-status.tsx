/**
 * ConnectionStatus Component
 * Displays real-time WebSocket connection status
 * Part of Story 4.4 - Implement Frontend WebSocket Client with y-websocket
 */

'use client';

import React from 'react';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionStatus as Status } from '@/lib/hooks/use-websocket-provider';
import { cn } from '@/lib/utils/utils';

export interface ConnectionStatusProps {
  /**
   * Current connection status
   */
  status: Status;

  /**
   * Callback to trigger manual reconnection
   */
  onReconnect?: () => void;

  /**
   * Whether to show the reconnect button when disconnected
   */
  showReconnectButton?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Display variant
   */
  variant?: 'default' | 'minimal' | 'badge';
}

/**
 * Connection status indicator component
 *
 * Shows:
 * - "Connected" with green indicator when connected
 * - "Connecting..." with spinner when connecting
 * - "Disconnected" with red indicator when disconnected
 * - Optional reconnect button when disconnected
 *
 * Variants:
 * - default: Full text with icon
 * - minimal: Icon only with tooltip
 * - badge: Small badge with icon and abbreviated text
 */
export function ConnectionStatus({
  status,
  onReconnect,
  showReconnectButton = true,
  className,
  variant = 'default',
}: ConnectionStatusProps) {
  if (variant === 'minimal') {
    return (
      <div
        className={cn('flex items-center', className)}
        title={getStatusText(status)}
      >
        {getStatusIcon(status)}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          getStatusBadgeClasses(status),
          className
        )}
      >
        {getStatusIcon(status, 'sm')}
        <span>{getStatusTextShort(status)}</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1.5">
        {getStatusIcon(status)}
        <span className={cn('text-sm font-medium', getStatusTextClasses(status))}>
          {getStatusText(status)}
        </span>
      </div>

      {status === 'disconnected' && showReconnectButton && onReconnect && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onReconnect}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
}

/**
 * Get status icon based on connection state
 */
function getStatusIcon(status: Status, size: 'default' | 'sm' = 'default') {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  switch (status) {
    case 'connected':
      return <Wifi className={cn(sizeClass, 'text-green-600')} />;
    case 'connecting':
      return <Loader2 className={cn(sizeClass, 'text-yellow-600 animate-spin')} />;
    case 'syncing':
      return <Loader2 className={cn(sizeClass, 'text-blue-600 animate-spin')} />;
    case 'disconnected':
      return <WifiOff className={cn(sizeClass, 'text-red-600')} />;
  }
}

/**
 * Get full status text
 */
function getStatusText(status: Status): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'syncing':
      return 'Syncing...';
    case 'disconnected':
      return 'Disconnected';
  }
}

/**
 * Get short status text (for badge variant)
 */
function getStatusTextShort(status: Status): string {
  switch (status) {
    case 'connected':
      return 'Online';
    case 'connecting':
      return 'Connecting';
    case 'syncing':
      return 'Syncing';
    case 'disconnected':
      return 'Offline';
  }
}

/**
 * Get status text color classes
 */
function getStatusTextClasses(status: Status): string {
  switch (status) {
    case 'connected':
      return 'text-green-700';
    case 'connecting':
      return 'text-yellow-700';
    case 'syncing':
      return 'text-blue-700';
    case 'disconnected':
      return 'text-red-700';
  }
}

/**
 * Get badge background classes
 */
function getStatusBadgeClasses(status: Status): string {
  switch (status) {
    case 'connected':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'connecting':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'syncing':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'disconnected':
      return 'bg-red-100 text-red-800 border border-red-200';
  }
}

/**
 * Offline banner component
 * Shows a prominent banner when connection is lost
 */
export interface OfflineBannerProps {
  /**
   * Whether to show the banner
   */
  show: boolean;

  /**
   * Callback to trigger manual reconnection
   */
  onReconnect?: () => void;

  /**
   * Duration in milliseconds that the connection has been offline
   */
  offlineDuration?: number;

  /**
   * Whether the offline period exceeds 5 minutes (data loss risk)
   */
  isLongOfflinePeriod?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

export function OfflineBanner({
  show,
  onReconnect,
  offlineDuration = 0,
  isLongOfflinePeriod = false,
  className
}: OfflineBannerProps) {
  if (!show) return null;

  // Format offline duration for display
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Use red styling for long offline periods
  const isWarning = isLongOfflinePeriod;
  const borderColor = isWarning ? 'border-red-200' : 'border-yellow-200';
  const bgColor = isWarning ? 'bg-red-50' : 'bg-yellow-50';
  const iconColor = isWarning ? 'text-red-700' : 'text-yellow-700';
  const titleColor = isWarning ? 'text-red-900' : 'text-yellow-900';
  const textColor = isWarning ? 'text-red-700' : 'text-yellow-700';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border p-3',
        borderColor,
        bgColor,
        className
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className={cn('h-4 w-4', iconColor)} />
        <div className="text-sm">
          <p className={cn('font-medium', titleColor)}>
            {isWarning ? 'Warning: Extended offline period' : 'Connection lost'}
          </p>
          <p className={textColor}>
            {isWarning ? (
              <>
                You've been offline for {formatDuration(offlineDuration)}.
                Data loss risk increases with extended offline periods. Please reconnect soon.
              </>
            ) : (
              <>
                You're working offline{offlineDuration > 0 ? ` (${formatDuration(offlineDuration)})` : ''}.
                Changes will sync when connection is restored.
              </>
            )}
          </p>
        </div>
      </div>

      {onReconnect && (
        <Button size="sm" variant="outline" onClick={onReconnect}>
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
