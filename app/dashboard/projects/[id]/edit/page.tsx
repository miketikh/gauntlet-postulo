/**
 * Draft Editor Page - Split-Screen Layout
 * Collaborative editing interface with source documents and sidebar
 * Updated for Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLayoutPreferences } from '@/lib/hooks/use-layout-preferences';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { Button } from '@/components/ui/button';
import { FileText, Save, Download, Share2, PanelLeftClose, PanelRightClose, MessageSquare, Users, History } from 'lucide-react';
import Link from 'next/link';
import { CommandAction } from '@/components/editor/commands-palette';

// Code splitting: lazy load heavy editor components
const CollaborativeEditor = dynamic(
  () => import('@/components/editor/collaborative-editor').then(mod => ({ default: mod.CollaborativeEditor })),
  {
    loading: () => <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading editor...</p></div>,
    ssr: false
  }
);

const EditorLayout = dynamic(
  () => import('@/components/editor/editor-layout').then(mod => ({ default: mod.EditorLayout })),
  { ssr: false }
);

const EditorTopBar = dynamic(
  () => import('@/components/editor/editor-top-bar').then(mod => ({ default: mod.EditorTopBar })),
  { ssr: false }
);

const SourceDocumentsPanel = dynamic(
  () => import('@/components/editor/source-documents-panel').then(mod => ({ default: mod.SourceDocumentsPanel })),
  { ssr: false }
);

const EditorSidebar = dynamic(
  () => import('@/components/editor/editor-sidebar').then(mod => ({ default: mod.EditorSidebar })),
  { ssr: false }
);

const CommandsPalette = dynamic(
  () => import('@/components/editor/commands-palette'),
  { ssr: false }
);

const NoDraftView = dynamic(
  () => import('@/components/editor/no-draft-view').then(mod => ({ default: mod.NoDraftView })),
  { ssr: false }
);

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export default function CollaborativeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user, accessToken, logout } = useAuth();

  // State
  const [draft, setDraft] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [commentThreads, setCommentThreads] = useState<any[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);

  // Layout preferences
  const {
    preferences,
    toggleLeftPanel,
    toggleRightPanel,
    toggleRightSidebar,
  } = useLayoutPreferences({
    userId: user?.id,
    draftId: draft?.id,
  });

  // Fetch project, draft, and related data
  useEffect(() => {
    if (!accessToken || !projectId) return;

    const fetchData = async () => {
      try {
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (projectResponse.status === 401) {
          logout();
          router.push('/login');
          return;
        }

        if (!projectResponse.ok) {
          throw new Error('Failed to load project');
        }

        const projectData = await projectResponse.json();
        setProject(projectData.project);

        // Fetch draft by project ID
        let fetchedDraft = null;
        const draftResponse = await fetch(`/api/projects/${projectId}/draft`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (draftResponse.ok) {
          const draftData = await draftResponse.json();
          fetchedDraft = draftData.draft;
          console.log('[Edit Page] Draft received, plainText length:', fetchedDraft?.plainText?.length || 0);
          console.log('[Edit Page] Draft plainText preview:', fetchedDraft?.plainText?.substring(0, 100));
          setDraft(fetchedDraft);
        } else if (draftResponse.status === 404) {
          // Valid state: project exists but no draft generated yet
          console.log('No draft found for project - user can generate one');
          setDraft(null);
        } else {
          throw new Error('Failed to load draft');
        }

        // Fetch source documents
        const documentsResponse = await fetch(`/api/projects/${projectId}/documents`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData.documents || []);
        }

        // Fetch comment threads using the draft ID (only if draft exists)
        if (fetchedDraft?.id) {
          try {
            const commentsResponse = await fetch(`/api/drafts/${fetchedDraft.id}/comments`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              setCommentThreads(commentsData.threads || []);
            }
          } catch (err) {
            console.warn('Comments API not available:', err);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken, projectId, logout, router]);

  // Handle export to Word
  const handleExport = useCallback(async () => {
    if (!accessToken || !draft?.id) return;

    setIsExporting(true);
    try {
      const response = await fetch(`/api/drafts/${draft.id}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'docx',
          returnType: 'download',
          includeMetadata: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title || 'draft'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert(err instanceof Error ? err.message : 'Failed to export document');
    } finally {
      setIsExporting(false);
    }
  }, [accessToken, draft, project]);

  // Handle share
  const handleShare = useCallback(() => {
    // TODO: Implement share dialog
    console.log('Share clicked');
  }, []);

  // Define keyboard shortcuts commands
  const commands: CommandAction[] = [
    {
      id: 'save',
      label: 'Save Document',
      description: 'Manually save the current draft',
      icon: <Save className="h-4 w-4" />,
      shortcut: '⌘+S',
      onExecute: () => setSaveStatus('saving'),
      category: 'editor',
    },
    {
      id: 'export',
      label: 'Export to Word',
      description: 'Export draft as .docx file',
      icon: <Download className="h-4 w-4" />,
      shortcut: '⌘+E',
      onExecute: handleExport,
      category: 'actions',
    },
    {
      id: 'share',
      label: 'Share',
      description: 'Share document with collaborators',
      icon: <Share2 className="h-4 w-4" />,
      onExecute: handleShare,
      category: 'actions',
    },
    {
      id: 'toggle-source',
      label: 'Toggle Source Documents',
      description: 'Show/hide source documents panel',
      icon: <PanelLeftClose className="h-4 w-4" />,
      shortcut: '⌘+B',
      onExecute: toggleLeftPanel,
      category: 'view',
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      description: 'Show/hide right sidebar',
      icon: <PanelRightClose className="h-4 w-4" />,
      shortcut: '⌘+\\',
      onExecute: toggleRightSidebar,
      category: 'view',
    },
  ];

  // Setup keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      callback: () => setIsCommandsOpen(true),
      description: 'Open commands palette',
    },
    {
      key: 's',
      metaKey: true,
      callback: () => setSaveStatus('saving'),
      description: 'Save document',
    },
    {
      key: 'e',
      metaKey: true,
      callback: handleExport,
      description: 'Export to Word',
    },
    {
      key: 'b',
      metaKey: true,
      callback: toggleLeftPanel,
      description: 'Toggle source documents',
    },
    {
      key: '\\',
      metaKey: true,
      callback: toggleRightSidebar,
      description: 'Toggle sidebar',
    },
  ]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Error state (but NOT for missing draft - that's handled below)
  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Failed to load editor'}</p>
          <Button asChild>
            <Link href={`/dashboard/projects/${projectId}`}>Back to Project</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show NoDraftView if no draft exists
  if (!draft) {
    return <NoDraftView projectId={projectId} projectTitle={project?.title} />;
  }

  return (
    <>
      <EditorLayout
        topBar={
          <EditorTopBar
            project={{
              id: projectId,
              title: project.title,
              clientName: project.clientName,
              status: project.status,
            }}
            draftId={draft.id}
            saveStatus={saveStatus}
            onSave={() => setSaveStatus('saving')}
            onExport={handleExport}
            onOpenCommands={() => setIsCommandsOpen(true)}
            backUrl={`/dashboard/projects/${projectId}`}
          />
        }
        leftPanel={
          <SourceDocumentsPanel
            documents={documents}
            projectId={projectId}
          />
        }
        centerPanel={
          <div className="h-full p-4">
            <CollaborativeEditor
              draftId={draft.id}
              initialPlainText={draft.plainText}
              editable={true}
              placeholder="Start typing your demand letter..."
              autoSaveInterval={30000}
              enableWebSocket={true}
              showConnectionStatus={true}
              enablePresence={true}
              showPresenceIndicators={false}
              presenceLayout="sidebar"
              showActiveUsersList={false}
            />
          </div>
        }
        rightPanel={
          <EditorSidebar
            draftId={draft.id}
            currentUser={
              user
                ? {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                  }
                : null
            }
            remoteUsers={remoteUsers}
            commentThreads={commentThreads}
            isCollapsed={preferences.rightSidebarCollapsed}
            onToggleCollapse={toggleRightSidebar}
          />
        }
        showLeftPanel={preferences.showLeftPanel}
        showRightPanel={preferences.showRightPanel}
        defaultLeftPanelSize={preferences.leftPanelSize}
        defaultCenterPanelSize={preferences.centerPanelSize}
        defaultRightPanelSize={preferences.rightPanelSize}
        storageKey={`editor-layout-${projectId}`}
      />

      <CommandsPalette
        isOpen={isCommandsOpen}
        onClose={() => setIsCommandsOpen(false)}
        commands={commands}
      />
    </>
  );
}
