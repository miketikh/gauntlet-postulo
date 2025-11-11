'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Loader2,
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface DocumentViewerProps {
  documentId: string;
  fileName: string;
  fileType: string;
}

export function DocumentViewer({ documentId, fileName, fileType }: DocumentViewerProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch document with presigned URL
    fetch(`/api/documents/${documentId}`)
      .then(res => res.json())
      .then(data => {
        setPresignedUrl(data.document.presignedUrl);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load document');
        setLoading(false);
      });
  }, [documentId]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => setPageNumber(page => Math.max(1, page - 1));
  const goToNextPage = () => setPageNumber(page => Math.min(numPages, page + 1));
  const zoomIn = () => setScale(s => Math.min(2.5, s + 0.25));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25));
  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.getElementById('document-viewer')?.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  // PDF Viewer
  if (fileType === 'application/pdf' && presignedUrl) {
    return (
      <div id="document-viewer" className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>

            <span className="text-sm">{Math.round(scale * 100)}%</span>

            <Button size="sm" variant="outline" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="outline" onClick={toggleFullScreen}>
              <Maximize className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="outline" asChild>
              <a href={presignedUrl} download={fileName}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* PDF Display */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <div className="flex justify-center">
            <Document
              file={presignedUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loader2 className="animate-spin" />}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer
              />
            </Document>
          </div>
        </div>
      </div>
    );
  }

  // Image Viewer
  if (fileType.startsWith('image/') && presignedUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h3 className="font-semibold">{fileName}</h3>
          <Button size="sm" variant="outline" asChild>
            <a href={presignedUrl} download={fileName}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <img
            src={presignedUrl}
            alt={fileName}
            className="max-w-full h-auto mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <p className="text-slate-600">
        Preview not available for this file type.
        <a href={presignedUrl || '#'} download={fileName} className="text-blue-600 ml-2">
          Download file
        </a>
      </p>
    </Card>
  );
}
