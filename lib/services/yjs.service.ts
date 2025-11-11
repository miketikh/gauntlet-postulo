/**
 * Yjs Service
 * Handles Yjs document state encoding/decoding and persistence
 * Part of Story 4.2 - Integrate Yjs for CRDT-Based Document Sync
 */

import * as Y from 'yjs';
import { db } from '../db/client';
import { drafts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../errors';

/**
 * Create a new Yjs document for a draft
 * Returns the Y.Doc instance with an empty XmlText for rich text
 */
export function createYjsDocument(): Y.Doc {
  const ydoc = new Y.Doc();
  // Initialize XmlText for rich text content (used by Lexical)
  ydoc.get('root', Y.XmlText);
  return ydoc;
}

/**
 * Encode Yjs document state to base64 string for database storage
 * Uses Y.encodeStateAsUpdate to get the binary update
 */
export function encodeYjsDocument(ydoc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(ydoc);
  return Buffer.from(update).toString('base64');
}

/**
 * Decode base64 Yjs document state and apply to document
 * Creates a new Y.Doc and applies the stored state
 */
export function decodeYjsDocument(encodedState: string): Y.Doc {
  const ydoc = new Y.Doc();
  const update = Buffer.from(encodedState, 'base64');
  Y.applyUpdate(ydoc, update);
  return ydoc;
}

/**
 * Save Yjs document state to database
 * Encodes the document and updates the drafts table
 */
export async function saveYjsDocumentState(draftId: string, ydoc: Y.Doc): Promise<void> {
  const encodedState = encodeYjsDocument(ydoc);

  await db.update(drafts)
    .set({
      yjsDocument: encodedState,
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, draftId));
}

/**
 * Load Yjs document state from database
 * Returns a Y.Doc instance with the stored state applied
 * If no state exists, returns a new empty document
 */
export async function loadYjsDocumentState(draftId: string): Promise<Y.Doc> {
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    columns: {
      yjsDocument: true,
    },
  });

  if (!draft) {
    throw new NotFoundError('Draft not found');
  }

  // If no Yjs state exists yet, return a new empty document
  if (!draft.yjsDocument) {
    return createYjsDocument();
  }

  // Decode and return existing document
  return decodeYjsDocument(draft.yjsDocument);
}

/**
 * Initialize Yjs document for a new draft
 * Creates a new Y.Doc and saves its initial state to the database
 */
export async function initializeYjsDocument(draftId: string): Promise<Y.Doc> {
  const ydoc = createYjsDocument();
  await saveYjsDocumentState(draftId, ydoc);
  return ydoc;
}

/**
 * Update Yjs document with binary update data
 * Applies the update to the document and saves the new state
 * Used when receiving updates from clients
 */
export async function applyYjsUpdate(draftId: string, update: Uint8Array): Promise<void> {
  // Load current document state
  const ydoc = await loadYjsDocumentState(draftId);

  // Apply the update
  Y.applyUpdate(ydoc, update);

  // Save the updated state
  await saveYjsDocumentState(draftId, ydoc);
}

/**
 * Get Yjs document state as binary update
 * Useful for initial sync when a client connects
 */
export async function getYjsStateUpdate(draftId: string): Promise<Uint8Array> {
  const ydoc = await loadYjsDocumentState(draftId);
  return Y.encodeStateAsUpdate(ydoc);
}

/**
 * Extract plain text from Yjs document
 * Extracts text content from XmlText for search indexing and previews
 */
export function extractPlainTextFromYjs(ydoc: Y.Doc): string {
  const yText = ydoc.get('root', Y.XmlText) as Y.XmlText;
  return yText.toString().trim();
}

/**
 * Update draft plain text from Yjs document
 * Extracts plain text and updates the database
 * Should be called periodically or after significant edits
 */
export async function updateDraftPlainText(draftId: string): Promise<void> {
  const ydoc = await loadYjsDocumentState(draftId);
  const plainText = extractPlainTextFromYjs(ydoc);

  await db.update(drafts)
    .set({
      plainText,
      updatedAt: new Date(),
    })
    .where(eq(drafts.id, draftId));
}
