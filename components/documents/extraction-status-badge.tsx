'use client';

import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExtractionStatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ocrConfidence?: number;
}

/**
 * ExtractionStatusBadge Component
 * Displays extraction status with appropriate icon and color
 * Shows warning for low OCR confidence
 */
export function ExtractionStatusBadge({ status, ocrConfidence }: ExtractionStatusBadgeProps) {
  if (status === 'pending') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Pending
      </Badge>
    );
  }

  if (status === 'processing') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  // Completed - check OCR confidence
  if (ocrConfidence !== undefined) {
    if (ocrConfidence < 80) {
      return (
        <Badge variant="warning" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Confidence ({ocrConfidence.toFixed(0)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          OCR {ocrConfidence.toFixed(0)}%
        </Badge>
      );
    }
  }

  return (
    <Badge variant="default" className="gap-1">
      <CheckCircle className="h-3 w-3" />
      Completed
    </Badge>
  );
}
