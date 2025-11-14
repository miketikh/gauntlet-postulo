'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface ExtractionStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  preview: string | null;
  fullTextLength: number;
  ocrConfidence?: number;
}

interface ExtractionPreviewProps {
  documentId: string;
}

/**
 * ExtractionPreview Component
 * Displays PDF text extraction status and preview
 * Polls for updates while extraction is in progress
 */
export function ExtractionPreview({ documentId }: ExtractionPreviewProps) {
  const [status, setStatus] = useState<ExtractionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      try {
        const { data } = await apiClient.get(`/api/documents/${documentId}/extraction`);
        setStatus(data);
        setLoading(false);
        setError(null);

        // Stop polling if extraction is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          if (interval) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error fetching extraction status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds while processing
    interval = setInterval(() => {
      if (status?.status === 'processing' || status?.status === 'pending' || !status) {
        fetchStatus();
      }
    }, 2000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [documentId, status?.status]);

  if (loading && !status) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-slate-600">Loading extraction status...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {status.status === 'completed' && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        {status.status === 'failed' && (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
        {(status.status === 'processing' || status.status === 'pending') && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        )}

        <h3 className="font-semibold">Text Extraction</h3>
      </div>

      {status.status === 'completed' && status.preview && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-slate-600">
              Extracted {status.fullTextLength.toLocaleString()} characters
            </p>
            {status.ocrConfidence !== undefined && (
              <Badge variant={status.ocrConfidence < 80 ? 'warning' : 'default'}>
                OCR: {status.ocrConfidence.toFixed(0)}%
              </Badge>
            )}
          </div>
          <div className="bg-slate-50 p-3 rounded text-sm font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto border border-slate-200">
            {status.preview}
          </div>
          {status.ocrConfidence !== undefined && status.ocrConfidence < 80 && (
            <p className="text-sm text-yellow-600 mt-2">
              Warning: Low OCR confidence. Please review extracted text for accuracy.
            </p>
          )}
        </div>
      )}

      {status.status === 'completed' && !status.preview && (
        <p className="text-sm text-slate-600">
          Text extraction completed, but no text was found in the document.
        </p>
      )}

      {status.status === 'failed' && (
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <p className="text-sm text-red-600">
            Text extraction failed. Please try re-uploading the document or contact support if the problem persists.
          </p>
        </div>
      )}

      {status.status === 'processing' && (
        <p className="text-sm text-slate-600">
          Extracting text from PDF... This may take up to 2 minutes.
        </p>
      )}

      {status.status === 'pending' && (
        <p className="text-sm text-slate-600">
          Text extraction is queued and will begin shortly...
        </p>
      )}
    </Card>
  );
}
