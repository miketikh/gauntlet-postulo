/**
 * Source Documents Panel Component
 * Tabbed panel for viewing multiple source documents
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentViewer } from '@/components/documents/document-viewer';
import { Button } from '@/components/ui/button';
import { FileText, Image, FileIcon, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';

interface SourceDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export interface SourceDocumentsPanelProps {
  /**
   * List of source documents
   */
  documents: SourceDocument[];

  /**
   * Project ID for fetching documents
   */
  projectId: string;

  /**
   * Callback when a document is selected
   */
  onDocumentSelect?: (documentId: string) => void;

  /**
   * Whether the panel is collapsed
   */
  isCollapsed?: boolean;

  /**
   * Callback to toggle collapsed state
   */
  onToggleCollapse?: () => void;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Panel for viewing source documents with tabbed interface
 *
 * Features:
 * - Tabbed interface for multiple documents
 * - Document viewer integration
 * - File type icons
 * - Collapsible header
 * - Empty state when no documents
 */
export function SourceDocumentsPanel({
  documents,
  projectId,
  onDocumentSelect,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: SourceDocumentsPanelProps) {
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(
    documents.length > 0 ? documents[0].id : null
  );

  const handleDocumentChange = (documentId: string) => {
    setActiveDocumentId(documentId);
    onDocumentSelect?.(documentId);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    }
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTruncatedFileName = (fileName: string, maxLength = 15) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength - extension!.length - 4);
    return `${truncated}...${extension}`;
  };

  return (
    <div className={cn('flex flex-col h-full border-r bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Source Documents</h3>
          <Badge variant="secondary" className="text-xs">
            {documents.length}
          </Badge>
        </div>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <>
          {documents.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground mb-2">
                No source documents uploaded
              </p>
              <p className="text-xs text-muted-foreground">
                Upload documents to reference them while editing
              </p>
            </div>
          ) : (
            // Tabbed document viewer
            <Tabs
              value={activeDocumentId || undefined}
              onValueChange={handleDocumentChange}
              className="flex flex-col h-full"
            >
              {/* Tab list with document names */}
              <div className="border-b bg-background">
                <ScrollArea className="w-full">
                  <TabsList className="inline-flex h-auto w-full justify-start gap-1 bg-transparent p-1">
                    {documents.map((doc) => (
                      <TabsTrigger
                        key={doc.id}
                        value={doc.id}
                        className="relative flex items-center gap-2 px-3 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        {getFileIcon(doc.fileType)}
                        <span className="max-w-[120px] truncate" title={doc.fileName}>
                          {getTruncatedFileName(doc.fileName, 20)}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </ScrollArea>
              </div>

              {/* Tab content with document viewer */}
              <div className="flex-1 overflow-hidden">
                {documents.map((doc) => (
                  <TabsContent
                    key={doc.id}
                    value={doc.id}
                    className="h-full m-0 focus-visible:outline-none focus-visible:ring-0"
                  >
                    {/* Document metadata */}
                    <div className="px-4 py-2 border-b bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={doc.fileName}>
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.fileSize)} • Uploaded by {doc.uploadedBy}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Document viewer */}
                    <div className="h-[calc(100%-60px)]">
                      <DocumentViewer
                        documentId={doc.id}
                        fileName={doc.fileName}
                        fileType={doc.fileType}
                      />
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
