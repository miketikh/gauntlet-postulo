/**
 * Diff Viewer Component
 * Shows differences between two versions with added/removed highlighting
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 */

'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Contributor {
  userId: string;
  name: string;
  changesCount: number;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

interface DiffData {
  fromVersion: number;
  toVersion: number;
  fromCreatedAt: string;
  toCreatedAt: string;
  diff: DiffLine[];
  contributorsBetween: Contributor[];
}

interface DiffViewerProps {
  draftId: string;
  fromVersion: number;
  toVersion: number;
  onClose?: () => void;
}

export function DiffViewer({
  draftId,
  fromVersion,
  toVersion,
  onClose,
}: DiffViewerProps) {
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiff();
  }, [draftId, fromVersion, toVersion]);

  const fetchDiff = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/drafts/${draftId}/diff?from=${fromVersion}&to=${toVersion}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch diff');
      }

      const data = await response.json();
      setDiffData(data.diff);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getContributorColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    return colors[index % colors.length];
  };

  const stats = diffData
    ? {
        added: diffData.diff.filter((line) => line.type === 'added').length,
        removed: diffData.diff.filter((line) => line.type === 'removed').length,
        unchanged: diffData.diff.filter((line) => line.type === 'unchanged').length,
      }
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-500">Loading diff...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="text-sm text-red-500">Error: {error}</div>
        <Button size="sm" onClick={fetchDiff}>
          Retry
        </Button>
      </div>
    );
  }

  if (!diffData) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">
              Comparing Versions {fromVersion} → {toVersion}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatDistanceToNow(new Date(diffData.fromCreatedAt), {
                addSuffix: true,
              })}{' '}
              →{' '}
              {formatDistanceToNow(new Date(diffData.toCreatedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 rounded" />
              <span className="text-gray-600">
                {stats.added} line{stats.added !== 1 ? 's' : ''} added
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 rounded" />
              <span className="text-gray-600">
                {stats.removed} line{stats.removed !== 1 ? 's' : ''} removed
              </span>
            </div>
          </div>
        )}

        {/* Contributors */}
        {diffData.contributorsBetween.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-600">Contributors:</span>
            <div className="flex items-center -space-x-2">
              {diffData.contributorsBetween.slice(0, 5).map((contributor, idx) => (
                <TooltipProvider key={contributor.userId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar
                        className={`h-7 w-7 border-2 border-white ${getContributorColor(
                          idx
                        )}`}
                      >
                        <AvatarFallback className="text-xs text-white">
                          {getInitials(contributor.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <div className="font-medium">{contributor.name}</div>
                        <div className="text-gray-500">
                          {contributor.changesCount} change
                          {contributor.changesCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {diffData.contributorsBetween.length > 5 && (
                <div className="h-7 w-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    +{diffData.contributorsBetween.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Diff Content */}
      <ScrollArea className="flex-1">
        <div className="font-mono text-sm">
          {diffData.diff.map((line, index) => {
            let bgColor = '';
            let textColor = 'text-gray-900';
            let prefix = ' ';

            if (line.type === 'added') {
              bgColor = 'bg-green-50';
              textColor = 'text-green-900';
              prefix = '+';
            } else if (line.type === 'removed') {
              bgColor = 'bg-red-50';
              textColor = 'text-red-900';
              prefix = '-';
            }

            return (
              <div
                key={index}
                className={`${bgColor} ${textColor} px-4 py-1 border-l-2 ${
                  line.type === 'added'
                    ? 'border-green-400'
                    : line.type === 'removed'
                    ? 'border-red-400'
                    : 'border-transparent'
                }`}
              >
                <span className="text-gray-400 select-none mr-2">{prefix}</span>
                {line.text || '\u00A0'}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
