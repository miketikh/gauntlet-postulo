'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentViewer } from './document-viewer';
import { FileText, Image } from 'lucide-react';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
}

interface DocumentListTabsProps {
  documents: Document[];
}

export function DocumentListTabs({ documents }: DocumentListTabsProps) {
  const [activeTab, setActiveTab] = useState(documents[0]?.id);

  if (documents.length === 0) {
    return (
      <div className="p-6 text-center text-slate-600">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="w-full justify-start overflow-x-auto">
        {documents.map(doc => (
          <TabsTrigger key={doc.id} value={doc.id} className="flex items-center gap-2">
            {doc.fileType === 'application/pdf' ? (
              <FileText className="h-4 w-4" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            <span className="max-w-[120px] truncate">{doc.fileName}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {documents.map(doc => (
        <TabsContent key={doc.id} value={doc.id} className="flex-1 mt-0">
          <DocumentViewer
            documentId={doc.id}
            fileName={doc.fileName}
            fileType={doc.fileType}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
