'use client';

/**
 * Version Preview Dialog Component
 * Story 3.8: Template Versioning and History
 * AC #5: Clicking version loads readonly preview of that version's structure
 * Shows a readonly view of a specific template version with all sections and variables
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SectionPreview } from '@/components/templates/section-preview';
import { formatDistanceToNow } from 'date-fns';
import {
  X,
  Hash,
  Clock,
  User,
  RotateCcw,
  FileText,
} from 'lucide-react';
import type { TemplateVersionWithStructure } from './version-history-modal';

interface VersionPreviewDialogProps {
  version: TemplateVersionWithStructure | null;
  templateName: string;
  currentVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: TemplateVersionWithStructure) => void;
  canRestore: boolean;
}

export function VersionPreviewDialog({
  version,
  templateName,
  currentVersion,
  open,
  onOpenChange,
  onRestore,
  canRestore,
}: VersionPreviewDialogProps) {
  if (!version) return null;

  const isCurrentVersion = version.versionNumber === currentVersion;
  const sectionCount = version.structure.sections?.length || 0;
  const variableCount = version.structure.variables?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                {templateName} - Version {version.versionNumber}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Readonly preview of this version's structure
              </DialogDescription>
            </div>

            {isCurrentVersion && (
              <Badge variant="default" className="bg-purple-600">
                Current Version
              </Badge>
            )}
          </div>

          {/* Version Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 pt-3">
            {/* Version Number */}
            <div className="flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-slate-400" />
              <span>Version {version.versionNumber}</span>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-400" />
              <span>
                Created by {version.creator.firstName} {version.creator.lastName}
              </span>
            </div>

            {/* Created Date */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>
                {formatDistanceToNow(new Date(version.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Structure Stats */}
            <div className="flex items-center gap-2 text-xs bg-slate-100 px-2 py-1 rounded">
              <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{variableCount} variable{variableCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto py-6 px-1">
          <div className="bg-white rounded-lg border p-6">
            <SectionPreview
              templateName={templateName}
              sections={version.structure.sections || []}
              variables={version.structure.variables || []}
            />
          </div>

          {/* Info Banner for empty versions */}
          {sectionCount === 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                This version has no sections defined. This may be an early draft of the template.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {isCurrentVersion ? (
              <span className="flex items-center gap-1.5 text-purple-600">
                <FileText className="h-4 w-4" />
                This is the current version
              </span>
            ) : (
              <span>
                Viewing historical version {version.versionNumber}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {!isCurrentVersion && canRestore && (
              <Button
                variant="default"
                onClick={() => {
                  onRestore(version);
                  onOpenChange(false);
                }}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restore This Version
              </Button>
            )}

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
