'use client';

/**
 * Version History Modal Component
 * Story 3.8: Template Versioning and History
 * AC #4: Version list displays version number, created date, created by user
 * AC #5: Clicking version loads readonly preview of that version
 * AC #8: Version history accessible from template detail page
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient, getErrorMessage } from '@/lib/api/client';
import { formatDistanceToNow } from 'date-fns';
import {
  History,
  Clock,
  User,
  Eye,
  RotateCcw,
  Loader2,
  AlertCircle,
  Hash
} from 'lucide-react';
import type { TemplateSection, TemplateVariable } from '@/lib/types/template';

interface VersionHistoryModalProps {
  templateId: string;
  templateName: string;
  currentVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVersionSelect: (version: TemplateVersionWithStructure) => void;
  onRestore: (version: TemplateVersionWithStructure) => void;
  canRestore: boolean;
}

export interface TemplateVersionWithStructure {
  id: string;
  templateId: string;
  versionNumber: number;
  structure: {
    sections: TemplateSection[];
    variables: TemplateVariable[];
  };
  createdAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface VersionHistoryResponse {
  template: {
    id: string;
    name: string;
    currentVersion: number;
  };
  versions: TemplateVersionWithStructure[];
}

export function VersionHistoryModal({
  templateId,
  templateName,
  currentVersion,
  open,
  onOpenChange,
  onVersionSelect,
  onRestore,
  canRestore,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<TemplateVersionWithStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch version history when modal opens
  useEffect(() => {
    if (!open || !templateId) return;

    const fetchVersions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<VersionHistoryResponse>(
          `/api/templates/${templateId}/versions`
        );
        setVersions(response.data.versions);
      } catch (err) {
        console.error('Error fetching version history:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [open, templateId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of "{templateName}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-slate-400 animate-spin mb-3" />
              <p className="text-slate-600">Loading version history...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
              <p className="text-slate-900 font-semibold mb-2">Failed to load versions</p>
              <p className="text-slate-600 text-sm">{error}</p>
            </div>
          )}

          {/* Version List */}
          {!loading && !error && versions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-600">No version history available</p>
            </div>
          )}

          {!loading && !error && versions.length > 0 && (
            <div className="space-y-3">
              {versions.map((version) => {
                const isCurrentVersion = version.versionNumber === currentVersion;
                const sectionCount = version.structure.sections?.length || 0;
                const variableCount = version.structure.variables?.length || 0;

                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 hover:bg-slate-50 transition-colors ${
                      isCurrentVersion ? 'border-purple-300 bg-purple-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Version Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-slate-400" />
                          <h3 className="font-semibold text-slate-900">
                            Version {version.versionNumber}
                          </h3>
                          {isCurrentVersion && (
                            <Badge variant="default" className="bg-purple-600">
                              Current
                            </Badge>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          {/* Creator */}
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {version.creator.firstName} {version.creator.lastName}
                            </span>
                          </div>

                          {/* Created Date */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {formatDistanceToNow(new Date(version.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Structure Info */}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{variableCount} variable{variableCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVersionSelect(version)}
                          className="gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </Button>

                        {!isCurrentVersion && canRestore && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onRestore(version)}
                            className="gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex justify-between items-center text-sm text-slate-600">
          <div>
            {versions.length > 0 && (
              <span>
                {versions.length} version{versions.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
