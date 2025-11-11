/**
 * Document Upload Page
 * Main page for uploading case documents to a new demand letter project
 * Based on Story 2.1 requirements
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DocumentUploadZone } from '@/components/documents/document-upload-zone';
import { FileQueueList } from '@/components/documents/file-queue-list';
import { useDocumentUpload } from '@/lib/hooks/use-document-upload';

export default function UploadPage() {
  const router = useRouter();
  const {
    queuedFiles,
    addFiles,
    removeFile,
    uploadAll,
    isUploading,
  } = useDocumentUpload();

  const [showApiWarning, setShowApiWarning] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    addFiles(files);
  };

  const handleContinue = async () => {
    // Navigate to template selection
    // Note: File upload functionality will be implemented in Story 2.2
    // For now, we proceed directly to template selection
    router.push('/dashboard/projects/new/template');
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          New Demand Letter
        </h1>
        <p className="text-slate-600">
          Upload case documents to get started. You can add medical records, police reports, and other supporting evidence.
        </p>
      </div>

      {/* API Warning (Story 2.2 will remove this) */}
      {showApiWarning && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  API Not Yet Implemented
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  The upload API endpoint will be implemented in Story 2.2. For now, uploads are simulated with mock data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Supported formats: PDF, DOCX, JPEG, PNG (up to 50MB per file)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Zone */}
          <DocumentUploadZone
            onFilesSelected={handleFilesSelected}
            disabled={isUploading}
          />

          {/* File Queue */}
          {queuedFiles.length > 0 && (
            <div className="pt-6 border-t border-slate-200">
              <FileQueueList
                files={queuedFiles}
                onRemoveFile={removeFile}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {queuedFiles.length === 0
            ? 'No files selected'
            : `${queuedFiles.length} file${queuedFiles.length !== 1 ? 's' : ''} selected`}
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={queuedFiles.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Continue to Template Selection'}
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h3 className="text-sm font-medium text-slate-900 mb-2">
          Tips for uploading documents:
        </h3>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>Upload all relevant case documents in a single session</li>
          <li>Ensure documents are clear and readable for best AI extraction</li>
          <li>You can upload multiple files at once by selecting them together</li>
          <li>Remove any files you don&apos;t want to include before continuing</li>
        </ul>
      </div>
    </div>
  );
}
