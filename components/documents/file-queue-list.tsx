/**
 * File Queue List Component
 * Displays queued files with status, progress, and remove action
 * Based on Story 2.1 requirements
 */

'use client';

import { FileText, Image as ImageIcon, FileType, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QueuedFile } from '@/lib/hooks/use-document-upload';
import { formatFileSize, getFileIconType } from '@/lib/utils/file-validation';

interface FileQueueListProps {
  files: QueuedFile[];
  onRemoveFile: (fileId: string) => void;
}

export function FileQueueList({ files, onRemoveFile }: FileQueueListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-700">
        Selected Files ({files.length})
      </h3>

      <div className="space-y-2">
        {files.map((queuedFile) => (
          <FileQueueItem
            key={queuedFile.id}
            queuedFile={queuedFile}
            onRemove={() => onRemoveFile(queuedFile.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface FileQueueItemProps {
  queuedFile: QueuedFile;
  onRemove: () => void;
}

function FileQueueItem({ queuedFile, onRemove }: FileQueueItemProps) {
  const { file, status, progress, error } = queuedFile;
  const fileIconType = getFileIconType(file);

  // Get file icon based on type
  const FileIcon = {
    pdf: FileText,
    doc: FileType,
    image: ImageIcon,
  }[fileIconType];

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className="flex-shrink-0 mt-1">
          <div className="rounded bg-slate-100 p-2">
            <FileIcon className="h-5 w-5 text-slate-600" />
          </div>
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatFileSize(file.size)}
              </p>
            </div>

            {/* Status Icon and Remove Button */}
            <div className="flex items-center gap-2">
              {status === 'success' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              {status !== 'uploading' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  className="h-8 w-8 text-slate-400 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {status === 'uploading' && (
            <div className="mt-2 space-y-1">
              <Progress value={progress} max={100} />
              <p className="text-xs text-slate-500">{progress}% uploaded</p>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <p className="text-xs text-green-600 mt-1">
              Upload complete
            </p>
          )}

          {/* Error Message */}
          {status === 'error' && error && (
            <p className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
