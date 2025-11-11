/**
 * Editor Layout Tests
 * Tests for the split-screen layout component
 * Part of Story 4.10 - Build Collaborative Editor Layout (Split-Screen)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditorLayout } from '../editor-layout';

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  PanelGroup: ({ children }: any) => <div data-testid="panel-group">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle" />,
}));

describe('EditorLayout', () => {
  const mockTopBar = <div data-testid="top-bar">Top Bar</div>;
  const mockLeftPanel = <div data-testid="left-panel">Left Panel</div>;
  const mockCenterPanel = <div data-testid="center-panel">Center Panel</div>;
  const mockRightPanel = <div data-testid="right-panel">Right Panel</div>;

  beforeEach(() => {
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders all panels in desktop view', () => {
    render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    expect(screen.getByTestId('center-panel')).toBeInTheDocument();
    expect(screen.getByTestId('right-panel')).toBeInTheDocument();
  });

  it('hides left panel when showLeftPanel is false', () => {
    render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
        showLeftPanel={false}
      />
    );

    expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('center-panel')).toBeInTheDocument();
    expect(screen.getByTestId('right-panel')).toBeInTheDocument();
  });

  it('hides right panel when showRightPanel is false', () => {
    render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
        showRightPanel={false}
      />
    );

    expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    expect(screen.getByTestId('center-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
  });

  it('renders resize handles in desktop view', () => {
    render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    const resizeHandles = screen.getAllByTestId('resize-handle');
    expect(resizeHandles.length).toBeGreaterThan(0);
  });

  it('applies custom storage key', () => {
    const { container } = render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
        storageKey="custom-key"
      />
    );

    const panelGroup = container.querySelector('[id="custom-key"]');
    expect(panelGroup).toBeInTheDocument();
  });

  it('uses default panel sizes when not specified', () => {
    render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    expect(screen.getByTestId('center-panel')).toBeInTheDocument();
    expect(screen.getByTestId('right-panel')).toBeInTheDocument();
  });
});

describe('EditorLayout - Mobile View', () => {
  const mockTopBar = <div data-testid="top-bar">Top Bar</div>;
  const mockLeftPanel = <div data-testid="left-panel">Left Panel</div>;
  const mockCenterPanel = <div data-testid="center-panel">Center Panel</div>;
  const mockRightPanel = <div data-testid="right-panel">Right Panel</div>;

  beforeEach(() => {
    // Set mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  it('renders tab navigation in mobile view', async () => {
    render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Trigger resize event
    fireEvent(window, new Event('resize'));
    await waitFor(() => {
      expect(screen.getByText('Source Documents')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('Sidebar')).toBeInTheDocument();
    });
  });

  it('switches tabs in mobile view', async () => {
    render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Trigger resize event
    fireEvent(window, new Event('resize'));
    await waitFor(() => {
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    // Click on Source Documents tab
    const sourceTab = screen.getByText('Source Documents');
    fireEvent.click(sourceTab);

    await waitFor(() => {
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    });
  });
});

describe('EditorLayout - Tablet View', () => {
  const mockTopBar = <div data-testid="top-bar">Top Bar</div>;
  const mockLeftPanel = <div data-testid="left-panel">Left Panel</div>;
  const mockCenterPanel = <div data-testid="center-panel">Center Panel</div>;
  const mockRightPanel = <div data-testid="right-panel">Right Panel</div>;

  beforeEach(() => {
    // Set tablet viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('stacks panels vertically in tablet view', async () => {
    render(
      <EditorLayout
        topBar={mockTopBar}
        leftPanel={mockLeftPanel}
        centerPanel={mockCenterPanel}
        rightPanel={mockRightPanel}
      />
    );

    // Trigger resize event
    fireEvent(window, new Event('resize'));
    await waitFor(() => {
      // All panels should be visible in tablet view
      expect(screen.getByTestId('left-panel')).toBeInTheDocument();
      expect(screen.getByTestId('center-panel')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    });
  });
});
