'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle } from 'lucide-react';

interface NoDraftViewProps {
  projectId: string;
  projectTitle?: string;
}

export function NoDraftView({ projectId, projectTitle }: NoDraftViewProps) {
  const router = useRouter();

  const handleGenerate = () => {
    router.push(`/dashboard/projects/${projectId}/generate`);
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-slate-600" />
          </div>
          <CardTitle>No Document Generated Yet</CardTitle>
          <CardDescription>
            {projectTitle ? `"${projectTitle}"` : 'This project'} doesn't have a generated document yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">What's next?</p>
              <p>
                Generate a document using AI or create one manually. Once generated, you'll be able to
                edit and collaborate on it here.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleGenerate} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Generate Document
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              className="flex-1"
            >
              Back to Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
