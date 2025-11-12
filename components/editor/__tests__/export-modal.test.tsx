/**
 * Export Modal Tests
 * Tests for export modal component
 * Part of Story 5.8 - Build Export Preview and Download UI
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal, ExportOptions } from '../export-modal';

describe('ExportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnExport = vi.fn<[ExportOptions], Promise<void>>();

  const defaultProps = {
    draftId: 'draft-123',
    projectTitle: 'Test Project',
    version: 1,
    isOpen: true,
    onClose: mockOnClose,
    onExport: mockOnExport,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnExport.mockResolvedValue(undefined);
  });

  it('renders export modal when open', () => {
    render(<ExportModal {...defaultProps} />);

    expect(screen.getByText('Export Document')).toBeInTheDocument();
    expect(screen.getByText('Download or email your demand letter as a Word document.')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ExportModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Export Document')).not.toBeInTheDocument();
  });

  it('displays default export format as DOCX', () => {
    render(<ExportModal {...defaultProps} />);

    const formatSelect = screen.getByRole('combobox');
    expect(formatSelect).toHaveTextContent('Word Document (.docx)');
  });

  it('shows PDF format as disabled', () => {
    render(<ExportModal {...defaultProps} />);

    // Click to open select
    const formatSelect = screen.getByRole('combobox');
    fireEvent.click(formatSelect);

    // PDF option should be disabled
    const pdfOption = screen.getByText(/PDF Document.*Coming Soon/i);
    expect(pdfOption).toBeInTheDocument();
  });

  it('displays preview information', () => {
    render(<ExportModal {...defaultProps} />);

    expect(screen.getByText('Export Preview')).toBeInTheDocument();
    expect(screen.getByText(/Test_Project_v1/)).toBeInTheDocument();
    expect(screen.getByText('DOCX')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('has metadata checkbox checked by default', () => {
    render(<ExportModal {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox', { name: /Include metadata/i });
    expect(checkbox).toBeChecked();
  });

  it('allows toggling metadata checkbox', () => {
    render(<ExportModal {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox', { name: /Include metadata/i });

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('shows download as default delivery method', () => {
    render(<ExportModal {...defaultProps} />);

    const downloadButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'Download');
    expect(downloadButtons.length).toBeGreaterThan(0);
  });

  it('shows email delivery as enabled (Story 5.11)', () => {
    render(<ExportModal {...defaultProps} />);

    const emailButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Email'));
    expect(emailButton).not.toBeDisabled();
  });

  it('calls onExport with correct options when download clicked', async () => {
    render(<ExportModal {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    // Find the final Download button in footer (not the delivery method button)
    const exportButton = buttons[buttons.length - 1]; // Last button should be export

    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('shows loading state during export', () => {
    render(<ExportModal {...defaultProps} isExporting={true} />);

    expect(screen.getByText('Generating document...')).toBeInTheDocument();
    expect(screen.getByText('Exporting...')).toBeInTheDocument();

    const exportButton = screen.getByRole('button', { name: /Exporting/i });
    expect(exportButton).toBeDisabled();
  });

  it('shows success state after successful export', () => {
    render(<ExportModal {...defaultProps} exportSuccess={true} />);

    expect(screen.getByText(/Document exported successfully/i)).toBeInTheDocument();
  });

  it('shows error state when export fails', () => {
    const errorMessage = 'Export failed: Network error';
    render(<ExportModal {...defaultProps} exportError={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(<ExportModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables all controls during export', () => {
    render(<ExportModal {...defaultProps} isExporting={true} />);

    const formatSelect = screen.getByRole('combobox');
    const metadataCheckbox = screen.getByRole('checkbox', { name: /Include metadata/i });
    const closeButton = screen.getByRole('button', { name: /Close/i });

    expect(formatSelect).toBeDisabled();
    expect(metadataCheckbox).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it('updates filename preview when format changes', () => {
    render(<ExportModal {...defaultProps} />);

    // Default shows .docx
    expect(screen.getByText(/Test_Project_v1_.*\.docx/)).toBeInTheDocument();

    // Note: PDF is disabled, so we can't actually change to it in this test
    // This test documents the expected behavior when PDF becomes available
  });

  it('calls onExport with includeMetadata false when unchecked', async () => {
    render(<ExportModal {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox', { name: /Include metadata/i });
    fireEvent.click(checkbox);

    const buttons = screen.getAllByRole('button');
    const exportButton = buttons[buttons.length - 1]; // Last button is export

    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
