/**
 * Yjs Service Tests
 * Tests for Yjs document creation, encoding, and persistence
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import {
  createYjsDocument,
  encodeYjsDocument,
  decodeYjsDocument,
  extractPlainTextFromYjs,
} from '../yjs.service';

describe('Yjs Service', () => {
  describe('createYjsDocument', () => {
    it('should create a new Yjs document', () => {
      const ydoc = createYjsDocument();

      expect(ydoc).toBeInstanceOf(Y.Doc);
    });

    it('should initialize with root XmlText', () => {
      const ydoc = createYjsDocument();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      expect(yText).toBeDefined();
      expect(yText).toBeInstanceOf(Y.XmlText);
    });

    it('should create empty document', () => {
      const ydoc = createYjsDocument();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      expect(yText.toString()).toBe('');
    });
  });

  describe('encodeYjsDocument and decodeYjsDocument', () => {
    it('should encode and decode empty document', () => {
      const originalDoc = createYjsDocument();
      const encoded = encodeYjsDocument(originalDoc);

      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');

      const decodedDoc = decodeYjsDocument(encoded);
      expect(decodedDoc).toBeInstanceOf(Y.Doc);
    });

    it('should preserve document content after encode/decode', () => {
      // Create document with content
      const originalDoc = new Y.Doc();
      const yText = originalDoc.get('root', Y.XmlText) as Y.XmlText;

      // Add some content
      yText.insert(0, 'Hello, world!');

      // Encode and decode
      const encoded = encodeYjsDocument(originalDoc);
      const decodedDoc = decodeYjsDocument(encoded);

      // Verify content is preserved
      const decodedText = decodedDoc.get('root', Y.XmlText) as Y.XmlText;
      expect(decodedText).toBeInstanceOf(Y.XmlText);
      expect(decodedText.toString()).toBe('Hello, world!');
    });

    it('should handle base64 encoding correctly', () => {
      const doc = createYjsDocument();
      const encoded = encodeYjsDocument(doc);

      // Should be valid base64
      expect(() => Buffer.from(encoded, 'base64')).not.toThrow();

      // Should decode successfully
      const decoded = decodeYjsDocument(encoded);
      expect(decoded).toBeInstanceOf(Y.Doc);
    });
  });

  describe('extractPlainTextFromYjs', () => {
    it('should extract empty string from empty document', () => {
      const ydoc = createYjsDocument();
      const plainText = extractPlainTextFromYjs(ydoc);

      expect(plainText).toBe('');
    });

    it('should extract text from document', () => {
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      yText.insert(0, 'Hello, world!');

      const plainText = extractPlainTextFromYjs(ydoc);
      expect(plainText).toBe('Hello, world!');
    });

    it('should extract multiline text', () => {
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      yText.insert(0, 'First line\nSecond line');

      const plainText = extractPlainTextFromYjs(ydoc);
      expect(plainText).toBe('First line\nSecond line');
    });

    it('should handle text with formatting', () => {
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      yText.insert(0, 'Bold text');
      yText.format(0, 4, { bold: true });

      const plainText = extractPlainTextFromYjs(ydoc);
      // XmlText includes formatting tags in toString()
      expect(plainText).toContain('Bold');
      expect(plainText).toContain('text');
    });
  });

  describe('Yjs document updates', () => {
    it('should apply updates correctly', () => {
      const doc1 = createYjsDocument();
      const doc2 = createYjsDocument();

      // Make change in doc1
      const yText1 = doc1.get('root', Y.XmlText) as Y.XmlText;
      yText1.insert(0, 'Test content');

      // Get update from doc1
      const update = Y.encodeStateAsUpdate(doc1);

      // Apply update to doc2
      Y.applyUpdate(doc2, update);

      // Verify doc2 has the same content
      const yText2 = doc2.get('root', Y.XmlText) as Y.XmlText;
      expect(yText2.toString()).toBe('Test content');
    });

    it('should merge concurrent updates without conflicts', () => {
      const doc1 = createYjsDocument();
      const doc2 = createYjsDocument();

      // Both documents make changes
      const yText1 = doc1.get('root', Y.XmlText) as Y.XmlText;
      yText1.insert(0, 'From doc1');

      const yText2 = doc2.get('root', Y.XmlText) as Y.XmlText;
      yText2.insert(0, 'From doc2');

      // Exchange updates
      const update1 = Y.encodeStateAsUpdate(doc1);
      const update2 = Y.encodeStateAsUpdate(doc2);

      Y.applyUpdate(doc2, update1);
      Y.applyUpdate(doc1, update2);

      // Both documents should converge to same state
      const text1 = (doc1.get('root', Y.XmlText) as Y.XmlText).toString();
      const text2 = (doc2.get('root', Y.XmlText) as Y.XmlText).toString();

      expect(text1).toBe(text2);
      expect(text1.length).toBeGreaterThan(0);
    });
  });

  describe('Yjs XmlText operations', () => {
    it('should support inserting text', () => {
      const ydoc = createYjsDocument();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      yText.insert(0, 'Hello');

      expect(yText.toString()).toBe('Hello');
    });

    it('should support deleting text', () => {
      const ydoc = createYjsDocument();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      yText.insert(0, 'Hello World');
      yText.delete(5, 6); // Delete " World"

      expect(yText.toString()).toBe('Hello');
    });

    it('should support modifying text content', () => {
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      yText.insert(0, 'Initial text');

      // Modify text
      yText.insert(0, 'Prefix: ');
      yText.insert(yText.length, ' - Suffix');

      expect(yText.toString()).toBe('Prefix: Initial text - Suffix');
    });

    it('should support formatting', () => {
      const ydoc = new Y.Doc();
      const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;

      yText.insert(0, 'Bold text');
      yText.format(0, 4, { bold: true });

      // XmlText includes formatting tags in toString()
      const text = yText.toString();
      expect(text).toContain('Bold');
      expect(text).toContain('text');
    });
  });
});
