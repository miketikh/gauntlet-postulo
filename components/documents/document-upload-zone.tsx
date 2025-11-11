/**
 * Document Upload Zone Component
 * Drag-and-drop file upload area with visual feedback
 * Based on Story 2.1 requirements
 */

'use client';

import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/utils/file-validation';
import { cn } from '@/lib/utils/utils';

interface DocumentUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function DocumentUploadZone({
  onFilesSelected,
  disabled = false,
}: DocumentUploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    multiple: true,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
        'hover:border-slate-400 hover:bg-slate-50',
        isDragActive && 'border-slate-900 bg-slate-100',
        disabled && 'opacity-50 cursor-not-allowed hover:border-slate-300 hover:bg-white'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center gap-4">
        {/* Upload Icon */}
        <div
          className={cn(
            'rounded-full p-4 transition-colors',
            isDragActive ? 'bg-slate-200' : 'bg-slate-100'
          )}
        >
          <Upload
            className={cn(
              'h-12 w-12 transition-colors',
              isDragActive ? 'text-slate-900' : 'text-slate-600'
            )}
          />
        </div>

        {/* Main Text */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-900">
            {isDragActive ? 'Drop files here' : 'Upload Case Documents'}
          </h3>
          <p className="text-sm text-slate-600">
            Drag and drop files here, or click to browse
          </p>
        </div>

        {/* File Browser Button */}
        {!isDragActive && (
          <Button type="button" variant="outline" disabled={disabled}>
            <FileText className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
        )}

        {/* Accepted File Types */}
        <div className="flex items-center gap-6 text-xs text-slate-500 mt-2">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>PDF, DOCX</span>
          </div>
          <div className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            <span>JPEG, PNG</span>
          </div>
        </div>

        {/* Size Limit */}
        <p className="text-xs text-slate-500">
          Maximum file size: 50MB per file
        </p>
      </div>
    </div>
  );
}
