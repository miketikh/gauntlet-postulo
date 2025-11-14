/**
 * useExportDraft Hook
 * React hook for exporting drafts to Word documents
 * Part of Story 5.8 - Build Export Preview and Download UI
 */

'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';

export interface ExportDraftInput {
  draftId: string;
  format: 'docx' | 'pdf';
  includeMetadata: boolean;
  returnType?: 'url' | 'download';
  deliveryMethod?: 'download' | 'email';
  recipientEmail?: string;
}

export interface ExportDraftResult {
  exportId: string;
  fileName: string;
  fileSize: number;
  presignedUrl?: string;
  createdAt: string;
}

export interface UseExportDraftResult {
  exportDraft: (input: ExportDraftInput) => Promise<ExportDraftResult | null>;
  isExporting: boolean;
  exportSuccess: boolean;
  exportError: string | null;
  reset: () => void;
}

/**
 * Hook for exporting drafts to Word documents
 *
 * Features:
 * - Handles API call to export endpoint
 * - Manages loading, success, and error states
 * - Triggers browser download on success
 * - Supports email delivery (Story 5.11)
 *
 * @example
 * ```tsx
 * const { exportDraft, isExporting, exportSuccess, exportError } = useExportDraft();
 *
 * const handleExport = async () => {
 *   const result = await exportDraft({
 *     draftId: '123',
 *     format: 'docx',
 *     includeMetadata: true,
 *   });
 *
 *   if (result) {
 *     // Export successful - download will trigger automatically
 *     console.log('Export ID:', result.exportId);
 *   }
 * };
 * ```
 */
export function useExportDraft(): UseExportDraftResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const reset = () => {
    setIsExporting(false);
    setExportSuccess(false);
    setExportError(null);
  };

  const exportDraft = async (input: ExportDraftInput): Promise<ExportDraftResult | null> => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);

    try {
      const { data } = await apiClient.post(`/api/drafts/${input.draftId}/export`, {
        format: input.format,
        includeMetadata: input.includeMetadata,
        returnType: input.returnType || 'url',
        deliveryMethod: input.deliveryMethod || 'download',
        recipientEmail: input.recipientEmail,
      });

      const exportResult = data.export as ExportDraftResult;

      // Trigger browser download if presigned URL is available
      if (exportResult.presignedUrl && input.deliveryMethod === 'download') {
        // Open in new tab to trigger download
        window.open(exportResult.presignedUrl, '_blank');
      }

      setExportSuccess(true);
      setIsExporting(false);

      return exportResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export draft';
      setExportError(errorMessage);
      setIsExporting(false);
      return null;
    }
  };

  return {
    exportDraft,
    isExporting,
    exportSuccess,
    exportError,
    reset,
  };
}
