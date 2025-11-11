/**
 * Editor Layout Component
 * Split-screen collaborative editor layout with resizable panels
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils/utils';
import { GripVertical } from 'lucide-react';

export interface EditorLayoutProps {
  /**
   * Left panel content (source documents)
   */
  leftPanel: React.ReactNode;

  /**
   * Center panel content (editor)
   */
  centerPanel: React.ReactNode;

  /**
   * Right panel content (sidebar with presence, comments, version history)
   */
  rightPanel: React.ReactNode;

  /**
   * Top bar content (project title, save status, actions)
   */
  topBar: React.ReactNode;

  /**
   * Whether to show the left panel
   */
  showLeftPanel?: boolean;

  /**
   * Whether to show the right panel
   */
  showRightPanel?: boolean;

  /**
   * Default size of left panel (percentage)
   */
  defaultLeftPanelSize?: number;

  /**
   * Default size of center panel (percentage)
   */
  defaultCenterPanelSize?: number;

  /**
   * Default size of right panel (percentage)
   */
  defaultRightPanelSize?: number;

  /**
   * Minimum size of panels (percentage)
   */
  minPanelSize?: number;

  /**
   * Storage key for persisting panel sizes
   */
  storageKey?: string;

  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Split-screen layout for collaborative editing
 *
 * Features:
 * - Three resizable panels (left, center, right)
 * - Draggable dividers
 * - Responsive design (stacked on mobile/tablet)
 * - Layout preferences persistence
 * - Optional panels (can hide left/right)
 */
export function EditorLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  topBar,
  showLeftPanel = true,
  showRightPanel = true,
  defaultLeftPanelSize = 25,
  defaultCenterPanelSize = 50,
  defaultRightPanelSize = 25,
  minPanelSize = 15,
  storageKey = 'editor-layout',
  className,
}: EditorLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState<'source' | 'editor' | 'sidebar'>('editor');

  // Detect screen size for responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mobile view: tabs switch between panels
  if (isMobile) {
    return (
      <div className={cn('flex flex-col h-screen', className)}>
        {/* Top bar */}
        <div className="flex-shrink-0 border-b bg-background">
          {topBar}
        </div>

        {/* Tab navigation */}
        <div className="flex border-b bg-background">
          <button
            onClick={() => setActiveTab('source')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'source'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Source Documents
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'editor'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('sidebar')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'sidebar'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sidebar
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'source' && showLeftPanel && (
            <div className="h-full">{leftPanel}</div>
          )}
          {activeTab === 'editor' && (
            <div className="h-full">{centerPanel}</div>
          )}
          {activeTab === 'sidebar' && showRightPanel && (
            <div className="h-full">{rightPanel}</div>
          )}
        </div>
      </div>
    );
  }

  // Tablet view: vertically stacked panels
  if (isTablet) {
    return (
      <div className={cn('flex flex-col h-screen', className)}>
        {/* Top bar */}
        <div className="flex-shrink-0 border-b bg-background">
          {topBar}
        </div>

        {/* Content area */}
        <PanelGroup direction="vertical" className="flex-1">
          {/* Top section: source documents */}
          {showLeftPanel && (
            <>
              <Panel defaultSize={30} minSize={20}>
                <div className="h-full overflow-hidden">
                  {leftPanel}
                </div>
              </Panel>
              <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />
            </>
          )}

          {/* Middle section: editor */}
          <Panel defaultSize={showLeftPanel && showRightPanel ? 40 : 60} minSize={30}>
            <div className="h-full overflow-hidden">
              {centerPanel}
            </div>
          </Panel>

          {/* Bottom section: sidebar */}
          {showRightPanel && (
            <>
              <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />
              <Panel defaultSize={30} minSize={20}>
                <div className="h-full overflow-hidden">
                  {rightPanel}
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    );
  }

  // Desktop view: horizontal split-screen
  return (
    <div className={cn('flex flex-col h-screen', className)}>
      {/* Top bar */}
      <div className="flex-shrink-0 border-b bg-background">
        {topBar}
      </div>

      {/* Content area with resizable panels */}
      <PanelGroup
        direction="horizontal"
        className="flex-1"
        id={storageKey}
        autoSaveId={storageKey}
      >
        {/* Left panel: source documents */}
        {showLeftPanel && (
          <>
            <Panel
              defaultSize={defaultLeftPanelSize}
              minSize={minPanelSize}
              maxSize={50}
              order={1}
            >
              <div className="h-full overflow-hidden">
                {leftPanel}
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors flex items-center justify-center group">
              <div className="w-4 h-12 flex items-center justify-center rounded bg-border group-hover:bg-primary transition-colors">
                <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
              </div>
            </PanelResizeHandle>
          </>
        )}

        {/* Center panel: editor */}
        <Panel
          defaultSize={
            showLeftPanel && showRightPanel
              ? defaultCenterPanelSize
              : showLeftPanel || showRightPanel
              ? 75
              : 100
          }
          minSize={30}
          order={2}
        >
          <div className="h-full overflow-hidden">
            {centerPanel}
          </div>
        </Panel>

        {/* Right panel: sidebar */}
        {showRightPanel && (
          <>
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors flex items-center justify-center group">
              <div className="w-4 h-12 flex items-center justify-center rounded bg-border group-hover:bg-primary transition-colors">
                <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
              </div>
            </PanelResizeHandle>
            <Panel
              defaultSize={defaultRightPanelSize}
              minSize={minPanelSize}
              maxSize={40}
              order={3}
            >
              <div className="h-full overflow-hidden">
                {rightPanel}
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
