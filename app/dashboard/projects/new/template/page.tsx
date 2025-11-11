/**
 * Template Selection Page
 * Displays gallery of available firm templates for demand letter generation
 * Part of Story 2.8 - AI Generation Workflow UI
 */

import { db } from '@/lib/db/client';
import { templates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { TemplateGallery } from '@/components/templates/template-gallery';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function TemplateSelectionPage() {
  // TODO: Get user's firm from session
  // For now, we'll fetch all templates
  // In a real implementation, this would filter by firmId from the authenticated user
  const firmTemplates = await db.query.templates.findMany({
    orderBy: (templates, { desc }) => [desc(templates.createdAt)],
  });

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/projects/new/upload">
          <Button variant="ghost" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Select a Template
        </h1>
        <p className="text-slate-600">
          Choose a template for your demand letter. Each template is customized for your firm's needs.
        </p>
      </div>

      {/* Template Gallery */}
      <TemplateGallery templates={firmTemplates} />
    </div>
  );
}
