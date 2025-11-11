'use client';

/**
 * Templates Page (Placeholder)
 * Will be implemented in future iterations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Templates</h1>
        <p className="text-slate-600">
          Browse and manage demand letter templates
        </p>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-slate-100 p-4 mb-4">
            <FileText className="h-12 w-12 text-slate-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Templates Coming Soon
          </h2>
          <p className="text-slate-600 text-center max-w-md">
            Template management features will be available in the next development phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
