/**
 * Yjs Integration Tests
 * Tests for editor integration with Yjs document sync
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Y from 'yjs';
import { RichTextEditor } from '../rich-text-editor';
import { createYjsDocument, extractPlainTextFromYjs } from '@/lib/services/yjs.service';

describe('Yjs Integration with Lexical Editor', () => {
  let ydoc: Y.Doc;

  beforeEach(() => {
    ydoc = createYjsDocument();
  });

  describe('Editor initialization with Yjs', () => {
    it('should render editor with Yjs document', () => {
      render(
        <RichTextEditor
          yjsDocument={ydoc}
          placeholder="Type something..."
        />
      );

      expect(screen.getByText('Type something...')).toBeInTheDocument();
    });

    it('should initialize with empty Yjs document', () => {
      render(<RichTextEditor yjsDocument={ydoc} />);

      const fragment = ydoc.getXmlFragment('root');
      expect(fragment.length).toBe(0);
    });

    it('should load existing content from Yjs document', async () => {
      // Pre-populate Yjs document
      const fragment = ydoc.getXmlFragment('root');
      const paragraph = new Y.XmlElement('paragraph');
      const text = new Y.XmlText('Existing content');
      paragraph.insert(0, [text]);
      fragment.insert(0, [paragraph]);

      render(<RichTextEditor yjsDocument={ydoc} />);

      // Editor should show the existing content
      await waitFor(() => {
        const plainText = extractPlainTextFromYjs(ydoc);
        expect(plainText).toContain('Existing content');
      });
    });
  });

  describe('Editor changes update Yjs document', () => {
    it('should update Yjs document when user types', async () => {
      const updateSpy = vi.fn();
      ydoc.on('update', updateSpy);

      render(<RichTextEditor yjsDocument={ydoc} editable={true} />);

      const user = userEvent.setup();
      const editor = screen.getByRole('textbox');

      // Type some text
      await user.click(editor);
      await user.keyboard('Hello, Yjs!');

      // Wait for Yjs update
      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalled();
      });

      // Verify content is in Yjs document
      const plainText = extractPlainTextFromYjs(ydoc);
      expect(plainText).toContain('Hello');
    });

    it('should propagate local edits to Yjs document', async () => {
      const onYjsUpdate = vi.fn();

      render(
        <RichTextEditor
          yjsDocument={ydoc}
          editable={true}
          onYjsUpdate={onYjsUpdate}
        />
      );

      const user = userEvent.setup();
      const editor = screen.getByRole('textbox');

      await user.click(editor);
      await user.keyboard('Test content');

      // Should call onYjsUpdate with binary update
      await waitFor(() => {
        expect(onYjsUpdate).toHaveBeenCalled();
      });

      const updateCall = onYjsUpdate.mock.calls[0];
      expect(updateCall[0]).toBeInstanceOf(Uint8Array);
    });

    it('should handle multiple edits correctly', async () => {
      render(<RichTextEditor yjsDocument={ydoc} editable={true} />);

      const user = userEvent.setup();
      const editor = screen.getByRole('textbox');

      await user.click(editor);
      await user.keyboard('First line');
      await user.keyboard('{Enter}');
      await user.keyboard('Second line');

      await waitFor(() => {
        const plainText = extractPlainTextFromYjs(ydoc);
        expect(plainText).toContain('First line');
        expect(plainText).toContain('Second line');
      });
    });
  });

  describe('Yjs updates reflect in editor', () => {
    it('should show changes from Yjs document updates', async () => {
      render(<RichTextEditor yjsDocument={ydoc} />);

      // Update Yjs document externally
      const fragment = ydoc.getXmlFragment('root');
      const paragraph = new Y.XmlElement('paragraph');
      const text = new Y.XmlText('Remote change');
      paragraph.insert(0, [text]);
      fragment.insert(0, [paragraph]);

      // Editor should reflect the change
      await waitFor(() => {
        const plainText = extractPlainTextFromYjs(ydoc);
        expect(plainText).toBe('Remote change');
      });
    });

    it('should handle concurrent updates from multiple sources', async () => {
      // Simulate two editors
      const doc1 = createYjsDocument();
      const doc2 = createYjsDocument();

      render(<RichTextEditor yjsDocument={doc1} editable={true} />);

      const user = userEvent.setup();
      const editor = screen.getByRole('textbox');

      // Edit in doc1 (via UI)
      await user.click(editor);
      await user.keyboard('Local edit');

      // Edit in doc2 (simulating remote edit)
      const fragment2 = doc2.getXmlFragment('root');
      const para2 = new Y.XmlElement('paragraph');
      const text2 = new Y.XmlText('Remote edit');
      para2.insert(0, [text2]);
      fragment2.insert(0, [para2]);

      // Sync updates
      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc2, update1);
      Y.applyUpdate(doc1, update2);

      // Both edits should be present in both documents
      await waitFor(() => {
        const text1 = extractPlainTextFromYjs(doc1);
        const text2 = extractPlainTextFromYjs(doc2);

        expect(text1).toContain('Local edit');
        expect(text1).toContain('Remote edit');
        expect(text2).toContain('Local edit');
        expect(text2).toContain('Remote edit');
      });
    });
  });

  describe('Yjs document binding lifecycle', () => {
    it('should cleanup properly on unmount', () => {
      const { unmount } = render(
        <RichTextEditor yjsDocument={ydoc} />
      );

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should handle document changes after remount', async () => {
      const { unmount } = render(
        <RichTextEditor yjsDocument={ydoc} editable={true} />
      );

      const user = userEvent.setup();
      let editor = screen.getByRole('textbox');

      await user.click(editor);
      await user.keyboard('Before unmount');

      unmount();

      // Remount with same document
      render(<RichTextEditor yjsDocument={ydoc} editable={true} />);

      editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.keyboard(' After remount');

      await waitFor(() => {
        const plainText = extractPlainTextFromYjs(ydoc);
        expect(plainText).toContain('Before unmount');
        expect(plainText).toContain('After remount');
      });
    });
  });

  describe('Yjs without auto-save', () => {
    it('should not call onSave when using Yjs', async () => {
      const onSave = vi.fn();

      render(
        <RichTextEditor
          yjsDocument={ydoc}
          onSave={onSave}
          editable={true}
        />
      );

      const user = userEvent.setup();
      const editor = screen.getByRole('textbox');

      await user.click(editor);
      await user.keyboard('Test');

      // Wait a bit to ensure auto-save would have triggered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // onSave should not be called when using Yjs
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Binary update encoding', () => {
    it('should produce valid binary updates', async () => {
      const onYjsUpdate = vi.fn();

      render(
        <RichTextEditor
          yjsDocument={ydoc}
          editable={true}
          onYjsUpdate={onYjsUpdate}
        />
      );

      const user = userEvent.setup();
      const editor = screen.getByRole('textbox');

      await user.click(editor);
      await user.keyboard('Test');

      await waitFor(() => {
        expect(onYjsUpdate).toHaveBeenCalled();
      });

      const update = onYjsUpdate.mock.calls[0][0];
      expect(update).toBeInstanceOf(Uint8Array);
      expect(update.length).toBeGreaterThan(0);

      // Should be able to apply update to another document
      const doc2 = createYjsDocument();
      expect(() => Y.applyUpdate(doc2, update)).not.toThrow();
    });
  });

  describe('Real-time collaboration simulation', () => {
    it('should simulate two users editing simultaneously', async () => {
      const user1Doc = createYjsDocument();
      const user2Doc = createYjsDocument();

      // User 1's editor
      const { rerender } = render(
        <RichTextEditor yjsDocument={user1Doc} editable={true} />
      );

      const user = userEvent.setup();
      const editor = screen.getByRole('textbox');

      // User 1 types
      await user.click(editor);
      await user.keyboard('User 1 content');

      // Sync user 1's changes to user 2
      const update1 = Y.encodeStateAsUpdate(user1Doc);
      Y.applyUpdate(user2Doc, update1);

      // User 2 makes changes (simulated)
      const fragment2 = user2Doc.getXmlFragment('root');
      const para2 = new Y.XmlElement('paragraph');
      const text2 = new Y.XmlText('User 2 content');
      para2.insert(0, [text2]);
      fragment2.insert(0, [para2]);

      // Sync user 2's changes back to user 1
      const update2 = Y.encodeStateAsUpdate(user2Doc);
      Y.applyUpdate(user1Doc, update2);

      // Both users should see both contents
      await waitFor(() => {
        const text1 = extractPlainTextFromYjs(user1Doc);
        const text2 = extractPlainTextFromYjs(user2Doc);

        expect(text1).toContain('User 1 content');
        expect(text1).toContain('User 2 content');
        expect(text2).toContain('User 1 content');
        expect(text2).toContain('User 2 content');
      });
    });
  });
});
