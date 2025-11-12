/**
 * Document Upload Hook
 * Manages file queue state and upload logic
 * Based on Story 2.1 requirements
 */

'use client';

import { useState } from 'react';
import { validateFile } from '@/lib/utils/file-validation';
import { useAuthStore } from '@/lib/stores/auth.store';

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
   */
  const uploadFile = async (fileId: string, projectId: string) => {
    const file = queuedFiles.find((f) => f.id === fileId);
    if (!file) return;

    // Update status to uploading
    setQueuedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    try {
      // Get auth token
      const accessToken = useAuthStore.getState().accessToken;

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('projectId', projectId);

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setQueuedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
          );
        }
      });

      // Handle completion
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });
      });

      // Start upload
      xhr.open('POST', '/api/documents/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.send(formData);

      // Wait for completion
      const data = await uploadPromise;

      // Update status to success
      setQueuedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'success',
                progress: 100,
                uploadedDocumentId: data.document.id,
              }
            : f
        )
      );
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
