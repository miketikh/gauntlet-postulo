'use client';

/**
 * Template Detail Page
 * Story 3.7: Template Preview with Sample Data
 * Story 3.8: Template Versioning and History
 * Story 3.3: AC #6 - Missing detail page that cards link to
 *
 * Displays full template preview with metadata, sections, action buttons, and version history
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionPreview } from '@/components/templates/section-preview';
import { VersionHistoryModal, type TemplateVersionWithStructure } from '@/components/templates/version-history-modal';
import { VersionPreviewDialog } from '@/components/templates/version-preview-dialog';
import { RestoreConfirmDialog } from '@/components/templates/restore-confirm-dialog';
import { apiClient, getErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/use-auth';
import type { TemplateSection, TemplateVariable } from '@/lib/types/template';
import {
  ArrowLeft,
  Edit,
  FileText,
  Printer,
  Calendar,
  User,
  Hash,
  CheckCircle2,
  XCircle,
  Loader2,
  History
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Template {
  id: string;
  name: string;
  description: string | null;
  sections: TemplateSection[];
  variables: TemplateVariable[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Version history state
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersionWithStructure | null>(null);
  const [versionPreviewOpen, setVersionPreviewOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<TemplateVersionWithStructure | null>(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  // Fetch template data
  useEffect(() => {
    if (!templateId) return;

    const fetchTemplate = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/api/templates/${templateId}`);
        setTemplate(response.data.template);
      } catch (err) {
        console.error('Error fetching template:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  // RBAC: Check if user can edit templates
  const canEdit = user?.role === 'admin' || user?.role === 'attorney';

  // Action handlers
  const handleEdit = () => {
    router.push(`/dashboard/templates/${templateId}/edit`);
  };

  const handleUse = () => {
    // Navigate to new project flow with pre-selected template
    router.push(`/dashboard/projects/new/template?templateId=${templateId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push('/dashboard/templates');
  };

  const handleVersionHistory = () => {
    setVersionHistoryOpen(true);
  };

  const handleVersionSelect = (version: TemplateVersionWithStructure) => {
    setSelectedVersion(version);
    setVersionPreviewOpen(true);
  };

  const handleVersionRestore = (version: TemplateVersionWithStructure) => {
    setVersionToRestore(version);
    setRestoreConfirmOpen(true);
  };

  const handleRestoreSuccess = () => {
    // Refresh template data after successful restore
    const fetchTemplate = async () => {
      try {
        const response = await apiClient.get(`/api/templates/${templateId}`);
        setTemplate(response.data.template);
      } catch (err) {
        console.error('Error refreshing template:', err);
      }
    };
    fetchTemplate();
    setVersionHistoryOpen(false);
    setRestoreConfirmOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-slate-400 animate-spin" />
          <p className="text-slate-600">Loading template...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !template) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Template Not Found</h1>
          <p className="text-slate-600 mb-6">
            {error || 'The template you are looking for does not exist or you do not have permission to view it.'}
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 print:py-4">
      {/* Header with metadata and actions */}
      <header className="mb-8 print:mb-4">
        {/* Back button - hide on print */}
        <div className="mb-4 print:hidden">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
        </div>

        {/* Template name and description */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-4xl font-bold text-slate-900 print:text-3xl">
              {template.name}
            </h1>

            {/* Status badge */}
            <Badge
              variant={template.isActive ? 'default' : 'secondary'}
              className={template.isActive
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-gray-100 text-gray-800 border-gray-200'
              }
            >
              {template.isActive ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>
          </div>

          {template.description && (
            <p className="text-lg text-slate-600 mt-2">
              {template.description}
            </p>
          )}
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-6 print:text-xs">
          {/* Version */}
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-slate-400" />
            <span>Version {template.version}</span>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span>
              Created by {template.creator.firstName} {template.creator.lastName}
            </span>
          </div>

          {/* Created date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Created {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Last modified */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Modified {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
            </span>
          </div>

          {/* Section count */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <span>
              {template.sections.length} section{template.sections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Action buttons - hide on print */}
        <div className="flex flex-wrap gap-3 print:hidden">
          {canEdit && (
            <Button onClick={handleEdit} variant="default">
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          )}

          <Button onClick={handleUse} variant="default">
            <FileText className="h-4 w-4 mr-2" />
            Use Template
          </Button>

          <Button onClick={handleVersionHistory} variant="outline">
            <History className="h-4 w-4 mr-2" />
            Version History
          </Button>

          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print Preview
          </Button>
        </div>
      </header>

      {/* Document preview */}
      <div className="document-preview bg-white rounded-lg border print:border-0">
        <div className="max-w-4xl mx-auto">
          <SectionPreview
            templateName={template.name}
            sections={template.sections}
            variables={template.variables}
          />
        </div>
      </div>

      {/* Print-friendly footer */}
      <footer className="hidden print:block mt-8 pt-4 border-t text-xs text-slate-500">
        <div className="flex justify-between items-center">
          <span>Template ID: {template.id}</span>
          <span>Version {template.version}</span>
          <span>Printed: {new Date().toLocaleDateString()}</span>
        </div>
      </footer>

      {/* Version History Modal */}
      <VersionHistoryModal
        templateId={template.id}
        templateName={template.name}
        currentVersion={template.version}
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        onVersionSelect={handleVersionSelect}
        onRestore={handleVersionRestore}
        canRestore={canEdit}
      />

      {/* Version Preview Dialog */}
      <VersionPreviewDialog
        version={selectedVersion}
        templateName={template.name}
        currentVersion={template.version}
        open={versionPreviewOpen}
        onOpenChange={setVersionPreviewOpen}
        onRestore={handleVersionRestore}
        canRestore={canEdit}
      />

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmDialog
        version={versionToRestore}
        templateName={template.name}
        currentVersion={template.version}
        open={restoreConfirmOpen}
        onOpenChange={setRestoreConfirmOpen}
        onSuccess={handleRestoreSuccess}
      />
    </div>
  );
}
