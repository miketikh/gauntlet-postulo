# Epic 4: Collaborative Editing Platform

**Expanded Goal:** Transform the Demand Letter Generator from a single-user tool into a collaborative platform where attorneys and paralegals can simultaneously edit documents with real-time synchronization, presence awareness, and commenting capabilities. This epic implements "Google Docs for legal documents," enabling seamless teamwork without the friction of email attachments, version confusion, or edit conflicts. The system must use Conflict-free Replicated Data Types (CRDTs) via Yjs to ensure that multiple users' edits merge automatically without data loss, even under poor network conditions or offline scenarios.

---

## Story 4.1: Integrate Rich Text Editor (Lexical or TipTap)

As a **developer**,
I want a rich text editor integrated into the draft view,
so that users can format and edit demand letter content with standard controls.

### Acceptance Criteria

1. Rich text editor library chosen and integrated (Lexical or TipTap based on team evaluation)
2. Editor supports formatting: bold, italic, underline, strikethrough, headings (H1-H6), bullet lists, numbered lists, block quotes
3. Editor includes formatting toolbar with common actions
4. Keyboard shortcuts work (Ctrl+B for bold, Ctrl+I for italic, etc.)
5. Editor loads initial draft content from API
6. Content auto-saves periodically (every 30 seconds or on pause in typing)
7. Manual "Save" button available for explicit saves
8. Save status indicator shows: "Saved", "Saving...", or "Unsaved changes"
9. Editor is accessible via keyboard navigation (tab through formatting buttons)
10. Content persisted as structured JSON (editor's native format) in database
11. Unit tests verify editor initialization and content loading
12. Integration test verifies content saves correctly

**Prerequisites:** Story 2.9 (draft storage), Story 1.11 (dashboard UI)

---

## Story 4.2: Integrate Yjs for CRDT-Based Document Sync

As a **developer**,
I want Yjs CRDT library integrated with the editor,
so that multi-user editing can merge changes without conflicts.

### Acceptance Criteria

1. Yjs library installed and configured in frontend
2. Yjs document created for each draft (shared type: Y.XmlFragment for rich text)
3. Editor content bound to Yjs document using editor-specific Yjs binding (e.g., `y-lexical` or `y-prosemirror`)
4. Local edits update Yjs document automatically
5. Yjs encodes document state as binary update for efficient sync
6. Document state persisted in database as binary blob in `drafts.yjs_document` column
7. Document initialization loads Yjs state from database
8. Editor reflects changes from Yjs updates in real-time
9. Unit tests verify Yjs document creation and binding
10. Integration test verifies editor changes update Yjs document

**Prerequisites:** Story 4.1 (rich text editor)

---

## Story 4.3: Implement WebSocket Server for Real-Time Sync

As a **developer**,
I want a WebSocket server that broadcasts Yjs updates,
so that multiple clients can sync document changes in real-time.

### Acceptance Criteria

1. WebSocket server configured using `ws` library on backend
2. Server listens on `/ws` endpoint (or separate WebSocket port)
3. Clients connect with authentication (JWT token passed during WebSocket handshake)
4. Server validates JWT and associates connection with user and draft
5. Server maintains map of connected clients per draft (room-based architecture)
6. When client sends Yjs update, server broadcasts to all other clients in same room
7. Server handles client disconnection gracefully (removes from room)
8. Server implements ping/pong heartbeat to detect dead connections
9. Connection errors logged with user and draft context
10. Server supports horizontal scaling (future: Redis pub/sub for multi-instance sync)
11. Unit tests verify WebSocket connection handling
12. Integration test verifies message broadcast to multiple clients

**Prerequisites:** Story 1.3 (backend API), Story 4.2 (Yjs integration)

---

## Story 4.4: Implement Frontend WebSocket Client with y-websocket

As a **developer**,
I want the frontend to connect to WebSocket server and sync Yjs updates,
so that real-time collaboration works end-to-end.

### Acceptance Criteria

1. `y-websocket` provider installed and configured in frontend
2. WebSocket connection established when user opens draft in editor
3. Connection URL includes draft ID: `ws://localhost:4000/ws?draftId=123&token=jwt`
4. Yjs document bound to WebSocket provider for automatic sync
5. Provider sends local updates to server via WebSocket
6. Provider applies remote updates received from server to local Yjs document
7. Connection status displayed in UI: "Connected", "Connecting...", "Disconnected"
8. Reconnection logic handles temporary network failures (exponential backoff)
9. Editor continues to function offline (changes queued for sync on reconnect)
10. Unit tests verify WebSocket provider configuration
11. Integration test verifies two browser instances sync changes in real-time

**Prerequisites:** Story 4.3 (WebSocket server), Story 4.2 (Yjs integration)

---

## Story 4.5: Implement Presence Awareness (User Cursors and Selections)

As an **attorney**,
I want to see where other users are editing in real-time,
so that I can avoid editing the same sections simultaneously.

### Acceptance Criteria

1. Yjs awareness protocol used to share user presence information
2. Each connected user broadcasts presence data: user ID, name, cursor position, selection range, color
3. User assigned unique color on connection (from predefined palette)
4. Remote users' cursors displayed in editor at their current position
5. Remote users' text selections highlighted with their assigned color (semi-transparent overlay)
6. Cursor labels show remote user's name on hover or always visible
7. Presence indicators update in real-time as users type or move cursor
8. Inactive users (no activity for 30 seconds) shown with dimmed presence indicator
9. Presence data cleared on user disconnect
10. Performance optimized: presence updates throttled (100-200ms) to avoid flooding
11. Unit tests verify presence data structure
12. Integration test verifies multiple users see each other's cursors

**Prerequisites:** Story 4.4 (WebSocket client), Story 4.2 (Yjs integration)

---

## Story 4.6: Build Presence Indicator UI (Active Users List)

As an **attorney**,
I want to see which team members are currently viewing or editing the document,
so that I know who's collaborating with me.

### Acceptance Criteria

1. Presence panel displays in editor sidebar or top bar
2. Panel shows avatars/initials of all connected users with color badges
3. User count displayed: "3 people editing"
4. Hovering over avatar shows full name and online status
5. Current user highlighted distinctly in list
6. Users marked as "Viewing" (connected but not editing) vs. "Editing" (active in last 10 seconds)
7. Presence list updates in real-time as users join/leave
8. Clicking user avatar scrolls editor to their cursor position (optional nice-to-have)
9. Panel collapsible to save screen space
10. Mobile view shows simplified presence indicator (count only, expandable)

**Prerequisites:** Story 4.5 (presence awareness)

---

## Story 4.7: Implement Comment Threads on Text Selections

As an **attorney**,
I want to add comments on specific text selections,
so that I can provide feedback and discuss changes with my team.

### Acceptance Criteria

1. Users can select text and click "Add Comment" button (or right-click context menu)
2. Comment modal opens with textarea for comment content
3. Comment submitted creates record in `comments` table: draft ID, user ID, position (JSON with start/end offsets), content, timestamp
4. Comments displayed in sidebar with text snippet and comment content
5. Commented text highlighted in editor with visual indicator (e.g., yellow background)
6. Clicking highlighted text opens comment thread in sidebar
7. Users can reply to comments (threaded conversation)
8. Comment threads include timestamps and author avatars
9. Users can resolve comments (marks comment as resolved, removes highlight)
10. Resolved comments hidden by default (toggle to show resolved)
11. Comment positions update as document content changes (Yjs awareness tracks offset shifts)
12. Real-time updates: new comments from other users appear immediately
13. Unit tests verify comment creation and position tracking
14. Integration test verifies comment threads across multiple users

**Prerequisites:** Story 4.4 (WebSocket client), Story 4.1 (rich text editor)

---

## Story 4.8: Implement Change Tracking with Author Attribution

As an **attorney**,
I want to see who made which changes to the document,
so that I can track contributions and review edits.

### Acceptance Criteria

1. Yjs metadata tracks author of each change (user ID embedded in update)
2. Backend creates snapshot of document in `draft_snapshots` table after significant edits (e.g., every 5 minutes or 100+ characters changed)
3. Snapshots include: version number, content, timestamp, list of contributors (users who edited since last snapshot)
4. `GET /api/drafts/:id/history` endpoint returns list of snapshots with metadata
5. History view displays timeline of changes with timestamps and authors
6. Clicking snapshot loads readonly preview of document at that point in time
7. Diff view shows changes between snapshots (added text in green, removed text in red)
8. Change attribution shown inline: hovering over text shows tooltip "Edited by John Doe at 2:34 PM"
9. History accessible from editor sidebar "Version History" tab
10. Unit tests verify snapshot creation logic
11. Integration test verifies multi-user edits recorded correctly

**Prerequisites:** Story 4.5 (presence awareness), Story 2.9 (version history)

---

## Story 4.9: Implement Offline Editing with Sync on Reconnect

As an **attorney**,
I want to continue editing if my internet connection drops,
so that temporary network issues don't interrupt my workflow.

### Acceptance Criteria

1. Editor remains functional when WebSocket connection lost
2. Local edits continue to update Yjs document in browser memory
3. UI shows "Offline - changes will sync when connection restored" banner
4. Yjs queues local updates for transmission when connection restored
5. WebSocket client automatically attempts reconnection (exponential backoff: 1s, 2s, 4s, 8s, max 30s)
6. On reconnection, queued updates sent to server in correct order
7. Remote updates received during offline period applied to local document
8. Conflict resolution handled automatically by Yjs CRDT (no user intervention required)
9. UI shows "Syncing..." during catch-up period after reconnect
10. Warning displayed if offline period exceeds 5 minutes (data loss risk increases)
11. Integration test simulates network interruption and verifies sync on reconnect

**Prerequisites:** Story 4.4 (WebSocket client), Story 4.2 (Yjs integration)

---

## Story 4.10: Build Collaborative Editor Layout (Split-Screen)

As an **attorney**,
I want a split-screen editor layout with source documents and draft side-by-side,
so that I can reference source materials while editing.

### Acceptance Criteria

1. Editor page at `/drafts/:id/edit` displays split-screen layout
2. **Left panel:** Source document viewer (tabbed for multiple documents)
3. **Center panel:** Rich text editor for draft content
4. **Right sidebar (collapsible):** Contains:
   - Presence indicators (who's online)
   - Comment threads list
   - Version history drawer
5. **Top bar:** Project title, save status, "Export to Word" button, share button
6. **Floating AI panel (optional):** AI refinement tools (accessed via button or shortcut)
7. Panel sizes adjustable via draggable dividers
8. Layout responsive: on tablet, panels stack vertically; on mobile, tabs switch between source/draft/comments
9. Keyboard shortcut to toggle sidebars (Ctrl+K for commands palette)
10. Layout preferences saved per user (panel sizes, collapsed state)

**Prerequisites:** Story 4.1 (rich text editor), Story 2.5 (document viewer), Story 4.6 (presence UI), Story 4.7 (comments)

---

## Story 4.11: Implement Document Locking and Permissions UI

As a **firm admin**,
I want to set document permissions,
so that I can control who can view, comment, or edit specific drafts.

### Acceptance Criteria

1. `draft_collaborators` table includes permission field: `view`, `comment`, `edit`
2. Document owner (creator) has full edit permissions by default
3. Owner can invite collaborators via email or user picker
4. Collaborator invitation specifies permission level (view/comment/edit)
5. Users with `view` permission can see document but cannot edit or comment
6. Users with `comment` permission can add comments but not edit content
7. Users with `edit` permission can modify document
8. Permissions enforced on both frontend (UI controls) and backend (API validation)
9. Attempting unauthorized action returns 403 Forbidden
10. Document sharing modal accessible from top bar "Share" button
11. Collaborator list shows all users with access and their permission levels
12. Owner can change permissions or remove collaborators
13. Unit tests verify permission enforcement logic
14. Integration test verifies permission levels work correctly

**Prerequisites:** Story 1.9 (RBAC), Story 4.10 (editor layout)
