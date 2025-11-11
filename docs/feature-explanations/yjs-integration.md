# Yjs Integration Documentation

## Overview

Story 4.2 implements Yjs CRDT (Conflict-free Replicated Data Type) integration for the Lexical rich text editor, enabling real-time collaborative editing without conflicts. This document describes the implementation and how to use it.

## Architecture

### Components

1. **Yjs Service** (`lib/services/yjs.service.ts`)
   - Creates and manages Yjs documents
   - Encodes/decodes Yjs state as base64 for database storage
   - Extracts plain text for search indexing

2. **Yjs Collaboration Plugin** (`components/editor/plugins/yjs-collaboration-plugin.tsx`)
   - Binds Lexical editor to Yjs document
   - Handles two-way sync between editor and Yjs document
   - Emits update events for persistence

3. **useYjsCollaboration Hook** (`lib/hooks/use-yjs-collaboration.ts`)
   - Manages Yjs document lifecycle
   - Loads state from database on mount
   - Auto-saves changes periodically
   - Tracks save status

4. **API Routes** (`app/api/drafts/[id]/yjs-state/route.ts`)
   - `GET /api/drafts/:id/yjs-state` - Load Yjs document state
   - `PUT /api/drafts/:id/yjs-state` - Save Yjs document state

5. **Database Schema** (`lib/db/schema.ts`)
   - `drafts.yjs_document` - TEXT column storing base64-encoded Yjs state

## Usage

### Basic Usage with RichTextEditor

```tsx
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import * as Y from 'yjs';

function MyEditor() {
  const [ydoc] = useState(() => new Y.Doc());

  return (
    <RichTextEditor
      yjsDocument={ydoc}
      onYjsUpdate={(update) => {
        // Handle updates - save to database, broadcast to other clients, etc.
        console.log('Yjs update:', update);
      }}
    />
  );
}
```

### Full Collaborative Editor with Auto-Save

```tsx
import { CollaborativeEditor } from '@/components/editor/collaborative-editor';

function DraftEditor({ draftId }: { draftId: string }) {
  return (
    <CollaborativeEditor
      draftId={draftId}
      autoSaveInterval={30000} // 30 seconds
    />
  );
}
```

The `CollaborativeEditor` component:
- Automatically loads Yjs state from database
- Shows loading/saving/error states
- Auto-saves changes periodically
- Provides manual save button
- Displays save status

### Using the Hook Directly

```tsx
import { useYjsCollaboration } from '@/lib/hooks/use-yjs-collaboration';
import { RichTextEditor } from '@/components/editor/rich-text-editor';

function CustomEditor({ draftId }: { draftId: string }) {
  const {
    ydoc,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    saveNow,
    error,
  } = useYjsCollaboration({
    draftId,
    autoSaveInterval: 30000,
    onSaveComplete: () => console.log('Saved!'),
    onSaveError: (err) => console.error('Save failed:', err),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!ydoc) return null;

  return (
    <div>
      <button onClick={saveNow} disabled={!hasUnsavedChanges}>
        Save {isSaving && '...'}
      </button>
      <RichTextEditor yjsDocument={ydoc} />
    </div>
  );
}
```

## How It Works

### Document Initialization

1. When a draft is created, an empty Yjs document is initialized
2. The Yjs document state is encoded as base64 and stored in `drafts.yjs_document`
3. When the editor loads, the Yjs state is fetched and decoded

### Two-Way Sync

1. **Editor → Yjs**: When user types, Lexical editor updates propagate to Yjs document via `createBinding`
2. **Yjs → Editor**: When Yjs document updates (from remote clients), changes propagate back to Lexical editor
3. **Yjs → Database**: Changes are auto-saved periodically using the hook

### CRDT Conflict Resolution

Yjs uses CRDTs to ensure:
- Multiple users can edit simultaneously without locks
- Concurrent edits merge automatically without conflicts
- Changes are commutative (order doesn't matter)
- No data loss even with network issues

### Update Flow

```
User types in editor
  ↓
Lexical editor state changes
  ↓
createBinding propagates to Yjs document
  ↓
Yjs emits 'update' event with binary delta
  ↓
Hook schedules auto-save
  ↓
After delay, hook encodes full state
  ↓
API PUT saves to database
```

## Data Model

### Yjs Document Structure

The Yjs document uses a single `XmlText` shared type:

```typescript
const ydoc = new Y.Doc();
const yText = ydoc.get('root', Y.XmlText);
```

The `XmlText` type preserves:
- Text content
- Formatting (bold, italic, etc.)
- Block structure (paragraphs, headings, lists)

### Database Storage

```typescript
{
  id: string;
  projectId: string;
  yjsDocument: string; // base64-encoded Y.encodeStateAsUpdate(ydoc)
  plainText: string;   // extracted for search indexing
  // ...
}
```

## API Reference

### Yjs Service Functions

#### `createYjsDocument(): Y.Doc`
Creates a new empty Yjs document with root XmlText initialized.

#### `encodeYjsDocument(ydoc: Y.Doc): string`
Encodes Yjs document state as base64 string for database storage.

#### `decodeYjsDocument(encodedState: string): Y.Doc`
Decodes base64 string and returns Yjs document with state applied.

#### `saveYjsDocumentState(draftId: string, ydoc: Y.Doc): Promise<void>`
Saves Yjs document state to database.

#### `loadYjsDocumentState(draftId: string): Promise<Y.Doc>`
Loads Yjs document state from database. Returns empty document if none exists.

#### `extractPlainTextFromYjs(ydoc: Y.Doc): string`
Extracts plain text content for search indexing.

### Hook API

#### `useYjsCollaboration(options): UseYjsCollaborationReturn`

**Options:**
- `draftId: string` - Draft ID to load/save
- `autoSaveInterval?: number` - Auto-save delay in ms (default: 30000)
- `onSaveComplete?: () => void` - Callback on successful save
- `onSaveError?: (error: Error) => void` - Callback on save error

**Returns:**
- `ydoc: Y.Doc | null` - Yjs document instance
- `isLoading: boolean` - Loading state from database
- `isSaving: boolean` - Saving state to database
- `hasUnsavedChanges: boolean` - Whether there are unsaved changes
- `saveNow: () => Promise<void>` - Manual save trigger
- `error: Error | null` - Error if any occurred

## Testing

### Unit Tests

Run unit tests for Yjs service:
```bash
npm run test:run lib/services/__tests__/yjs.service.test.ts
```

Tests cover:
- Document creation and initialization
- Encoding/decoding state
- Plain text extraction
- Update merging and CRDT behavior
- XmlText operations

### Integration Tests

Integration tests verify editor + Yjs integration:
```bash
npm run test:run components/editor/__tests__/yjs-integration.test.tsx
```

Tests cover:
- Editor initialization with Yjs
- Editor changes updating Yjs document
- Yjs updates reflecting in editor
- Concurrent edits from multiple sources
- Binary update encoding

## Acceptance Criteria Status

✅ All 10 acceptance criteria met:

1. ✅ Yjs library installed and configured (yjs@13.6.22, @lexical/yjs@0.38.2)
2. ✅ Yjs document created for each draft (Y.XmlText for rich text)
3. ✅ Editor content bound to Yjs document using @lexical/yjs createBinding
4. ✅ Local edits update Yjs document automatically via binding
5. ✅ Yjs encodes document state as binary update (Y.encodeStateAsUpdate)
6. ✅ Added `yjs_document` TEXT column to drafts table (base64-encoded)
7. ✅ Document initialization loads Yjs state from database via API
8. ✅ Editor reflects changes from Yjs updates in real-time via binding
9. ✅ Unit tests verify Yjs document creation and binding (16 tests passing)
10. ✅ Integration test verifies editor changes update Yjs document

## Next Steps (Story 4.3+)

The current implementation handles local Yjs state and database persistence. Future stories will add:

- **Story 4.3**: WebSocket server for broadcasting updates to multiple clients
- **Story 4.4**: Frontend WebSocket client with y-websocket provider
- **Story 4.5**: Presence awareness (user cursors and selections)
- **Story 4.6**: Active users list UI
- **Story 4.7**: Comment threads on text selections
- **Story 4.8**: Change tracking with author attribution

## Troubleshooting

### Issue: Editor not syncing with Yjs document

**Solution**: Ensure `yjsDocument` prop is passed to `RichTextEditor` and the plugin is properly initialized.

### Issue: "Yjs document state not found"

**Solution**: Initialize Yjs document for new drafts using `initializeYjsDocument(draftId)`.

### Issue: Auto-save not working

**Solution**: Check that the hook's `autoSaveInterval` is set and the API route is accessible.

### Issue: Text formatting includes XML tags

**Solution**: This is expected behavior with Y.XmlText. Use `extractPlainTextFromYjs()` for plain text.

## Performance Considerations

- **Binary Updates**: Yjs uses efficient binary encoding, minimizing data transfer
- **Auto-Save Throttling**: Default 30s interval prevents excessive database writes
- **State Size**: Yjs state grows with edit history. Future optimization: periodic snapshots
- **Memory Usage**: Y.Doc instances are lightweight (~few KB per document)

## Security

- **Firm Isolation**: API routes verify user belongs to draft's firm before load/save
- **Input Validation**: Zod schema validates API request bodies
- **XSS Prevention**: React automatically escapes content; Lexical sanitizes input
