/**
 * Export Modal Component
 * Modal for previewing and downloading exported documents
 * Part of Story 5.8 - Build Export Preview and Download UI
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

export interface ExportModalProps {
  /**
   * Draft ID to export
   */
  draftId: string;

  /**
   * Project title (for default filename)
   */
  projectTitle: string;

  /**
   * Draft version number
   */
  version: number;

  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Callback when export is initiated
   */
  onExport: (options: ExportOptions) => Promise<void>;

  /**
   * Whether export is in progress
   */
  isExporting?: boolean;

  /**
   * Export success state
   */
  exportSuccess?: boolean;

  /**
   * Export error message
   */
  exportError?: string | null;
}

export interface ExportOptions {
  format: 'docx' | 'pdf';
  includeMetadata: boolean;
  deliveryMethod: 'download' | 'email';
  recipientEmail?: string;
}

/**
 * Modal for configuring and initiating document export
 *
 * Features:
 * - Format selector (DOCX active, PDF disabled)
 * - Include metadata checkbox
 * - Preview section with filename and estimated size
 * - Download button (primary action)
 * - Email delivery button (Story 5.11)
 * - Loading, success, and error states
 */
export function ExportModal({
  draftId,
  projectTitle,
  version,
  isOpen,
  onClose,
  onExport,
  isExporting = false,
  exportSuccess = false,
  exportError = null,
}: ExportModalProps) {
  const [format, setFormat] = useState<'docx' | 'pdf'>('docx');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email'>('download');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Generate default filename
  const sanitizedTitle = projectTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const defaultFilename = `${sanitizedTitle}_v${version}_${new Date().toISOString().split('T')[0]}.${format}`;

  // Estimated file size (rough estimate)
  const estimatedSize = '50-100 KB';

  const handleExport = async () => {
    const options: ExportOptions = {
      format,
      includeMetadata,
      deliveryMethod,
      recipientEmail: deliveryMethod === 'email' ? recipientEmail : undefined,
    };

    await onExport(options);
  };

  const handleClose = () => {
    // Reset state when closing
    setFormat('docx');
    setIncludeMetadata(true);
    setDeliveryMethod('download');
    setRecipientEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
          <DialogDescription>
            Download or email your demand letter as a Word document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selector */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as 'docx' | 'pdf')}
              disabled={isExporting}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="docx">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Word Document (.docx)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf" disabled>
                  <div className="flex items-center text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>PDF Document (.pdf) - Coming Soon</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Metadata */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="metadata"
              checked={includeMetadata}
              onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
              disabled={isExporting}
            />
            <Label
              htmlFor="metadata"
              className="text-sm font-normal cursor-pointer"
            >
              Include metadata (version number, export date)
            </Label>
          </div>

          {/* Preview Section */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h4 className="text-sm font-semibold">Export Preview</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filename:</span>
                <span className="font-mono text-xs">{defaultFilename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="uppercase">{format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Size:</span>
                <span>{estimatedSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>v{version}</span>
              </div>
            </div>
          </div>

          {/* Delivery Method */}
          <div className="space-y-2">
            <Label>Delivery Method</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={deliveryMethod === 'download' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setDeliveryMethod('download')}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                type="button"
                variant={deliveryMethod === 'email' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setDeliveryMethod('email')}
                disabled={isExporting}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>

          {/* Email Input (if email delivery selected) */}
          {deliveryMethod === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={isExporting}
              />
            </div>
          )}

          {/* Success State */}
          {exportSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 border border-green-200">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                {deliveryMethod === 'download'
                  ? 'Document exported successfully. Opening download...'
                  : `Document sent successfully to ${recipientEmail}`}
              </div>
            </div>
          )}

          {/* Error State */}
          {exportError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="text-sm">{exportError}</div>
            </div>
          )}

          {/* Loading State */}
          {isExporting && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
              <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
              <div className="text-sm">Generating document...</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || (deliveryMethod === 'email' && !recipientEmail)}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : deliveryMethod === 'download' ? (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
