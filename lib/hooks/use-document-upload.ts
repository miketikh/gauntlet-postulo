/**
 * Document Upload Hook
 * Manages file queue state and upload logic
 * Based on Story 2.1 requirements
 */

'use client';

import { useState } from 'react';
import { validateFile } from '@/lib/utils/file-validation';

export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export interface QueuedFile {
  id: string;
  file: File;
  status: UploadState;
  progress: number;
  error?: string;
  uploadedDocumentId?: string;
}

export function useDocumentUpload() {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);

  /**
   * Add files to the upload queue
   */
  const addFiles = (files: File[]) => {
    const newFiles: QueuedFile[] = files.map((file) => {
      const validation = validateFile(file);

      return {
        id: crypto.randomUUID(),
        file,
        status: validation.valid ? 'idle' : 'error',
        progress: 0,
        error: validation.error,
      } as QueuedFile;
    });

    setQueuedFiles((prev) => [...prev, ...newFiles]);
  };

  /**
   * Remove a file from the queue
   */
  const removeFile = (fileId: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  /**
   * Upload a single file
   * NOTE: API endpoint will be implemented in Story 2.2
   */
  const uploadFile = async (fileId: string, _projectId: string) => {
    const file = queuedFiles.find((f) => f.id === fileId);
    if (!file) return;

    // Update status to uploading
    setQueuedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    try {
      // Mock upload for now - Story 2.2 will implement the actual API
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setQueuedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: i } : f))
        );
      }

      // Mock success
      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'success',
                progress: 100,
                uploadedDocumentId: crypto.randomUUID(),
              }
            : f
        )
      );

      // TODO: Replace with actual API call in Story 2.2
      /*
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('projectId', projectId);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'success',
                progress: 100,
                uploadedDocumentId: data.documentId,
              }
            : f
        )
      );
      */
    } catch (error) {
      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'error',
                error:
                  error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
    }
  };

  /**
   * Upload all queued files
   */
  const uploadAll = async (projectId: string) => {
    const filesToUpload = queuedFiles.filter((f) => f.status === 'idle');

    for (const file of filesToUpload) {
      await uploadFile(file.id, projectId);
    }
  };

  /**
   * Clear all files from queue
   */
  const clearQueue = () => {
    setQueuedFiles([]);
  };

  /**
   * Check if there's at least one successful upload
   */
  const hasSuccessfulUploads = queuedFiles.some((f) => f.status === 'success');

  /**
   * Check if any uploads are in progress
   */
  const isUploading = queuedFiles.some((f) => f.status === 'uploading');

  return {
    queuedFiles,
    addFiles,
    removeFile,
    uploadFile,
    uploadAll,
    clearQueue,
    hasSuccessfulUploads,
    isUploading,
  };
}
