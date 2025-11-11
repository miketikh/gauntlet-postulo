/**
 * Version History Panel
 * Displays timeline of snapshots with author attribution
 * Part of Story 4.8 - Implement Change Tracking with Author Attribution
 */

'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Users, Eye, GitCompare, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Contributor {
  userId: string;
  name: string;
  changesCount: number;
}

interface HistoryItem {
  id: string;
  version: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  changeDescription: string | null;
  contributors: Contributor[];
  plainText: string | null;
}

interface VersionHistoryPanelProps {
  draftId: string;
  onViewVersion?: (version: number) => void;
  onCompareVersions?: (fromVersion: number, toVersion: number) => void;
  onRestoreVersion?: (version: number) => void;
}

export function VersionHistoryPanel({
  draftId,
  onViewVersion,
  onCompareVersions,
  onRestoreVersion,
}: VersionHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareFromVersion, setCompareFromVersion] = useState<number | null>(null);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [draftId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/drafts/${draftId}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version: number) => {
    setSelectedVersion(version);
    onViewVersion?.(version);
  };

  const handleCompareClick = () => {
    if (compareMode && compareFromVersion !== null && selectedVersion !== null) {
      onCompareVersions?.(
        Math.min(compareFromVersion, selectedVersion),
        Math.max(compareFromVersion, selectedVersion)
      );
      setCompareMode(false);
      setCompareFromVersion(null);
    } else {
      setCompareMode(true);
      setCompareFromVersion(selectedVersion);
    }
  };

  const handleVersionSelect = (version: number) => {
    if (compareMode) {
      if (compareFromVersion === null) {
        setCompareFromVersion(version);
      } else {
        onCompareVersions?.(
          Math.min(compareFromVersion, version),
          Math.max(compareFromVersion, version)
        );
        setCompareMode(false);
        setCompareFromVersion(null);
      }
    } else {
      handleViewVersion(version);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-500">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="text-sm text-red-500">Error: {error}</div>
        <Button size="sm" onClick={fetchHistory}>
          Retry
        </Button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-500">No history available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Version History</h2>
        <p className="text-sm text-gray-500">
          {history.length} version{history.length !== 1 ? 's' : ''}
        </p>

        {/* Compare Mode Toggle */}
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant={compareMode ? 'default' : 'outline'}
            onClick={handleCompareClick}
            className="flex-1"
          >
            <GitCompare className="h-4 w-4 mr-1" />
            {compareMode
              ? compareFromVersion !== null
                ? 'Select second version'
                : 'Select first version'
              : 'Compare'}
          </Button>
          {compareMode && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setCompareMode(false);
                setCompareFromVersion(null);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {history.map((item, index) => {
            const isSelected = selectedVersion === item.version;
            const isCompareFrom = compareFromVersion === item.version;
            const isLatest = index === 0;

            return (
              <div
                key={item.id}
                className={`
                  relative pl-6 pb-4 cursor-pointer
                  ${index !== history.length - 1 ? 'border-l-2 border-gray-200' : ''}
                  ${isSelected ? 'bg-blue-50 -ml-4 pl-10 py-2 rounded-lg' : ''}
                  ${isCompareFrom ? 'bg-green-50 -ml-4 pl-10 py-2 rounded-lg' : ''}
                `}
                onClick={() => handleVersionSelect(item.version)}
              >
                {/* Timeline dot */}
                <div
                  className={`
                    absolute left-0 w-3 h-3 rounded-full -translate-x-1.5
                    ${isLatest ? 'bg-blue-500' : 'bg-gray-300'}
                  `}
                />

                {/* Version info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        Version {item.version}
                        {isLatest && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewVersion(item.version);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View this version</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Change description */}
                  {item.changeDescription && (
                    <div className="text-xs text-gray-600">
                      {item.changeDescription}
                    </div>
                  )}

                  {/* Creator */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-gray-200">
                        {getInitials(item.createdBy.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-600">
                      {item.createdBy.name}
                    </span>
                  </div>

                  {/* Contributors */}
                  {item.contributors.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-3 w-3 text-gray-400" />
                      <div className="flex items-center -space-x-2">
                        {item.contributors.slice(0, 3).map((contributor, idx) => (
                          <TooltipProvider key={contributor.userId}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar
                                  className={`h-6 w-6 border-2 border-white ${getContributorColor(
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
                                  <div className="font-medium">
                                    {contributor.name}
                                  </div>
                                  <div className="text-gray-500">
                                    {contributor.changesCount} change
                                    {contributor.changesCount !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {item.contributors.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">
                              +{item.contributors.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview text */}
                  {item.plainText && (
                    <div className="text-xs text-gray-500 line-clamp-2 mt-2">
                      {item.plainText}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
