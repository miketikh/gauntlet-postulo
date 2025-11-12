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
import { useAuthStore } from '@/lib/stores/auth.store';

export default function UploadPage() {
  const router = useRouter();
  const {
    queuedFiles,
    addFiles,
    removeFile,
    uploadAll,
    isUploading,
  } = useDocumentUpload();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    addFiles(files);

    // Create draft project if not already created
    if (!projectId && files.length > 0) {
      await createDraftProject();
    }
  };

  const createDraftProject = async () => {
    try {
      setIsCreatingProject(true);
      setError(null);

      const accessToken = useAuthStore.getState().accessToken;

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          templateId: null, // Will be set when user selects template
          variables: {},
          title: 'Draft Demand Letter',
          clientName: 'TBD',
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create draft project');
      }

      const { project } = await response.json();
      setProjectId(project.id);
    } catch (err) {
      console.error('Error creating draft project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleContinue = async () => {
    if (!projectId) {
      setError('No project created. Please try adding files again.');
      return;
    }

    try {
      setError(null);

      // Upload all files
      await uploadAll(projectId);

      // Navigate to template selection with projectId
      router.push(`/dashboard/projects/new/template?projectId=${projectId}`);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload files. Please try again.');
    }
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

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
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
            disabled={queuedFiles.length === 0 || isUploading || isCreatingProject || !projectId}
          >
            {isCreatingProject
              ? 'Creating Project...'
              : isUploading
              ? 'Uploading...'
              : 'Continue to Template Selection'}
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
