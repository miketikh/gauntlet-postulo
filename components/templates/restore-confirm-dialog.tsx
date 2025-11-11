'use client';

/**
 * Restore Confirmation Dialog Component
 * Story 3.8: Template Versioning and History
 * AC #6: "Restore This Version" button copies version structure to new current version
 * AC #7: Restored versions create new version number (not overwrite current)
 * Confirms before restoring a template version
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient, getErrorMessage } from '@/lib/api/client';
import {
  AlertTriangle,
  RotateCcw,
  Loader2,
  CheckCircle,
  XCircle,
  Hash,
  ArrowRight,
} from 'lucide-react';
import type { TemplateVersionWithStructure } from './version-history-modal';

interface RestoreConfirmDialogProps {
  version: TemplateVersionWithStructure | null;
  templateName: string;
  currentVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RestoreConfirmDialog({
  version,
  templateName,
  currentVersion,
  open,
  onOpenChange,
  onSuccess,
}: RestoreConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!version) return null;

  const newVersionNumber = currentVersion + 1;
  const sectionCount = version.structure.sections?.length || 0;
  const variableCount = version.structure.variables?.length || 0;

  const handleRestore = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.post(
        `/api/templates/${version.templateId}/versions/${version.versionNumber}/restore`,
        {
          changeDescription: `Restored from version ${version.versionNumber}`,
        }
      );

      setSuccess(true);

      // Wait a moment to show success state, then close and refresh
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error restoring version:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {success ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Version Restored
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Restore Template Version?
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {success ? (
              'The template version has been successfully restored.'
            ) : (
              `Confirm restoration of "${templateName}" to version ${version.versionNumber}`
            )}
          </DialogDescription>
        </DialogHeader>

        {!success && (
          <>
            {/* Explanation */}
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  How restoration works:
                </h4>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>This will create a <strong>new version ({newVersionNumber})</strong> of your template</li>
                  <li>The structure from version {version.versionNumber} will be copied to the new version</li>
                  <li>Your current version ({currentVersion}) will remain in history</li>
                  <li>This action cannot be undone (but you can restore again)</li>
                </ul>
              </div>

              {/* Version Details */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-slate-900">Version to restore:</h4>

                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="gap-1">
                    <Hash className="h-3 w-3" />
                    Version {version.versionNumber}
                  </Badge>
                  <span className="text-slate-600">
                    by {version.creator.firstName} {version.creator.lastName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{variableCount} variable{variableCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Version Flow Visualization */}
              <div className="flex items-center justify-center gap-3 text-sm py-2">
                <div className="text-center">
                  <Badge variant="outline" className="mb-1">
                    <Hash className="h-3 w-3 mr-1" />
                    v{currentVersion}
                  </Badge>
                  <p className="text-xs text-slate-500">Current</p>
                </div>

                <ArrowRight className="h-5 w-5 text-slate-400" />

                <div className="text-center">
                  <Badge variant="default" className="mb-1 bg-purple-600">
                    <Hash className="h-3 w-3 mr-1" />
                    v{newVersionNumber}
                  </Badge>
                  <p className="text-xs text-slate-500">After restore</p>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Restoration failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleRestore}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Restore Version {version.versionNumber}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {success && (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 mb-2">
              Template restored successfully!
            </p>
            <p className="text-sm text-slate-600">
              Version {version.versionNumber} has been restored as version {newVersionNumber}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
