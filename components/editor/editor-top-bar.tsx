/**
 * Editor Top Bar Component
 * Top bar with project info, save status, and action buttons
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 * Updated Story 4.11 - Added Share modal integration and collaborator count
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareModal } from './share-modal';
import { useDraftPermission } from '@/lib/hooks/use-draft-permission';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Save,
  Download,
  Share2,
  MoreVertical,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import Link from 'next/link';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface EditorTopBarProps {
  /**
   * Project information
   */
  project: {
    id: string;
    title: string;
    clientName?: string;
    status?: string;
  };

  /**
   * Draft ID for permission checking
   */
  draftId: string;

  /**
   * Save status
   */
  saveStatus: SaveStatus;

  /**
   * Whether save is in progress
   */
  isSaving?: boolean;

  /**
   * Callback to manually save
   */
  onSave?: () => void;

  /**
   * Callback to export to Word
   */
  onExport?: () => void;

  /**
   * Callback to open commands palette
   */
  onOpenCommands?: () => void;

  /**
   * Whether export is in progress
   */
  isExporting?: boolean;

  /**
   * Back URL (defaults to project page)
   */
  backUrl?: string;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Top bar for collaborative editor
 *
 * Features:
 * - Project title and info
 * - Back button to project
 * - Save status indicator
 * - Manual save button
 * - Export to Word button
 * - Share button
 * - Commands palette shortcut
 * - More actions menu
 */
export function EditorTopBar({
  project,
  draftId,
  saveStatus,
  isSaving = false,
  onSave,
  onExport,
  onOpenCommands,
  isExporting = false,
  backUrl,
  className,
}: EditorTopBarProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Get permission and collaborator info
  const { collaborators } = useDraftPermission(draftId);

  const getSaveStatusBadge = () => {
    switch (saveStatus) {
      case 'saved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Saved
          </Badge>
        );
      case 'saving':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Saving...
          </Badge>
        );
      case 'unsaved':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unsaved changes
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Save failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<string, { color: string; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
      in_review: { color: 'bg-blue-100 text-blue-700', label: 'In Review' },
      completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
      sent: { color: 'bg-purple-100 text-purple-700', label: 'Sent' },
    };

    const variant = variants[status] || variants.draft;

    return (
      <Badge variant="secondary" className={cn('text-xs', variant.color)}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className={cn('flex items-center justify-between px-6 py-3', className)}>
      {/* Left section: back button and project info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backUrl || `/dashboard/projects/${project.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold truncate">{project.title}</h1>
            {getStatusBadge(project.status)}
          </div>
          {project.clientName && (
            <p className="text-sm text-muted-foreground truncate">
              Client: {project.clientName}
            </p>
          )}
        </div>
      </div>

      {/* Right section: save status and actions */}
      <div className="flex items-center gap-3">
        {/* Save status */}
        {getSaveStatusBadge()}

        {/* Commands palette shortcut */}
        {onOpenCommands && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommands}
            className="hidden md:flex items-center gap-2"
          >
            <Command className="h-4 w-4" />
            <span className="text-xs">Commands</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        )}

        {/* Manual save button */}
        {onSave && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving || saveStatus === 'saved'}
            className="hidden sm:flex"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        )}

        {/* Export to Word button */}
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Export to Word</span>
            <span className="sm:hidden">Export</span>
          </Button>
        )}

        {/* Share button with collaborator count */}
        <Button size="sm" onClick={() => setIsShareOpen(true)}>
          <Share2 className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Share</span>
          {collaborators && collaborators.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {collaborators.length + 1}
            </Badge>
          )}
        </Button>

        {/* More actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onSave && (
              <DropdownMenuItem onClick={onSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save now
              </DropdownMenuItem>
            )}
            {onExport && (
              <DropdownMenuItem onClick={onExport} disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                Export to Word
              </DropdownMenuItem>
            )}
            {onOpenCommands && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenCommands}>
                  <Command className="h-4 w-4 mr-2" />
                  Commands palette
                  <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Share Modal */}
      <ShareModal
        draftId={draftId}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
