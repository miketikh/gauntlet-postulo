'use client';

/**
 * Version History Sidebar Component
 * Displays list of draft versions with restore capability
 * Based on PRD requirements for version history UI
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth.store';

// Icons - using Unicode symbols as fallback if lucide-react not installed
const HistoryIcon = () => <span style={{ fontSize: '1.25rem' }}>⏱</span>;
const RestoreIcon = () => <span style={{ fontSize: '0.875rem' }}>↩</span>;

interface Version {
  id: string;
  version: number;
  changeDescription: string;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface VersionHistorySidebarProps {
  draftId: string;
  onVersionSelect?: (version: Version) => void;
  onVersionRestore?: (version: number) => void;
}

export function VersionHistorySidebar({
  draftId,
  onVersionSelect,
  onVersionRestore,
}: VersionHistorySidebarProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  // Fetch versions on mount
  useEffect(() => {
    fetchVersions();
  }, [draftId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/drafts/${draftId}/versions`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
      console.error('Error fetching versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    if (!confirm(`Are you sure you want to restore version ${version}? This will create a new version with the content from version ${version}.`)) {
      return;
    }

    try {
      setRestoring(version);

      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/drafts/${draftId}/restore/${version}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

      // Reload versions to show new version
      await fetchVersions();

      // Callback for parent component
      if (onVersionRestore) {
        onVersionRestore(version);
      }

      // Reload page to show restored content
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore version');
      console.error('Error restoring version:', err);
    } finally {
      setRestoring(null);
    }
  };

  const handleVersionClick = (version: Version) => {
    setSelectedVersion(version.version);
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="w-80 border-l bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <HistoryIcon />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <div className="text-sm text-slate-500">Loading versions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 border-l bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <HistoryIcon />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <div className="text-sm text-red-600">{error}</div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchVersions}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-slate-50 p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <HistoryIcon />
        <h3 className="font-semibold">Version History</h3>
      </div>

      {versions.length === 0 ? (
        <div className="text-sm text-slate-500">No version history yet</div>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => {
            const isSelected = selectedVersion === version.version;
            const isRestoring = restoring === version.version;

            return (
              <Card
                key={version.id}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300'
                    : 'hover:bg-slate-100'
                }`}
                onClick={() => handleVersionClick(version)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">Version {version.version}</p>
                      {version.version === versions[0].version && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {version.changeDescription}
                    </p>
                    <p className="text-xs text-slate-700 mt-2">
                      {version.creator.firstName} {version.creator.lastName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(version.createdAt)}
                    </p>
                  </div>

                  {/* Only show restore button for non-current versions */}
                  {version.version !== versions[0].version && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version.version);
                      }}
                      disabled={isRestoring}
                      className="shrink-0"
                      title={`Restore version ${version.version}`}
                    >
                      {isRestoring ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <RestoreIcon />
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {versions.length >= 50 && (
        <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          Showing last 50 versions only
        </div>
      )}
    </div>
  );
}
