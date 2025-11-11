# Comments Feature - Quick Reference Guide

## For Developers

### Adding Comments to Your Editor

```tsx
import { useComments } from '@/lib/hooks/use-comments';
import { CommentsSidebar } from '@/components/editor/comments/comments-sidebar';
import { CommentModal } from '@/components/editor/comments/comment-modal';
import { CommentPlugin } from '@/components/editor/plugins/comment-plugin';

function MyEditor({ draftId }: { draftId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [selection, setSelection] = useState(null);

  const {
    threads,
    createComment,
    replyToThread,
    resolveThread,
    unresolveThread,
    editComment,
    deleteComment,
    refresh,
  } = useComments({ draftId });

  return (
    <>
      <RichTextEditor>
        <CommentPlugin
          threads={threads}
          onCreateComment={(sel) => {
            setSelection(sel);
            setShowModal(true);
          }}
          showAddButton
        />
      </RichTextEditor>

      <CommentsSidebar
        draftId={draftId}
        threads={threads}
        onReply={replyToThread}
        onResolve={resolveThread}
        onUnresolve={unresolveThread}
        onEdit={editComment}
        onDelete={deleteComment}
        onRefresh={refresh}
      />

      <CommentModal
        open={showModal}
        onOpenChange={setShowModal}
        onSubmit={async (content) => {
          await createComment({
            content,
            selectionStart: selection.start,
            selectionEnd: selection.end,
          });
        }}
        selectedText={selection?.text}
      />
    </>
  );
}
```

### API Usage

#### Fetch Comments

```typescript
const response = await fetch(`/api/drafts/${draftId}/comments?includeResolved=false`);
const { threads, count } = await response.json();
```

#### Create Comment

```typescript
const response = await fetch(`/api/drafts/${draftId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'My comment',
    selectionStart: 0,
    selectionEnd: 10,
  }),
});
const { comment } = await response.json();
```

#### Reply to Thread

```typescript
const response = await fetch(`/api/drafts/${draftId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'My reply',
    selectionStart: 0,
    selectionEnd: 10,
    threadId: 'thread-id-here',
  }),
});
```

#### Update Comment

```typescript
const response = await fetch(`/api/comments/${commentId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Updated content',
  }),
});
```

#### Resolve Thread

```typescript
const response = await fetch(`/api/comments/threads/${threadId}/resolve`, {
  method: 'POST',
});
```

#### Delete Comment

```typescript
const response = await fetch(`/api/comments/${commentId}`, {
  method: 'DELETE',
});
```

### Using Comment Service Directly

```typescript
import { commentService } from '@/lib/services/comment.service';

// Get threads
const threads = await commentService.getThreadsForDraft('draft-id', false);

// Create comment
const comment = await commentService.createComment('draft-id', 'user-id', {
  content: 'Comment text',
  selectionStart: 0,
  selectionEnd: 10,
});

// Resolve thread
await commentService.resolveThread('thread-id', 'user-id');
```

### WebSocket Integration

```typescript
import { broadcastCommentCreated } from '@/lib/services/comment-websocket.service';

// After creating a comment in your API route
broadcastCommentCreated(draftId, threadId, comment);
```

### Types

```typescript
import {
  CommentThread,
  CommentWithAuthor,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '@/lib/types/comment';
```

## For Users

### Creating a Comment

1. Select text in the editor
2. Click the "Add Comment" button that appears
3. Type your comment in the modal
4. Click "Add Comment" to submit

### Replying to a Comment

1. Find the comment thread in the sidebar
2. Click "Reply" at the bottom of the thread
3. Type your reply
4. Click "Reply" to submit

### Resolving a Comment

1. Find the comment thread in the sidebar
2. Click the "Resolve" button at the top right of the thread
3. The thread will be marked as resolved and hidden (unless "Show resolved" is toggled on)

### Editing Your Comment

1. Find your comment in the sidebar
2. Click the three-dot menu (⋮) next to your comment
3. Select "Edit"
4. Make your changes
5. Click "Save"

### Deleting Your Comment

1. Find your comment in the sidebar
2. Click the three-dot menu (⋮) next to your comment
3. Select "Delete"
4. Confirm deletion

### Viewing Resolved Comments

1. Look for the toggle switch at the top of the sidebar
2. Turn on "Show resolved" to see resolved comment threads
3. Turn it off to hide them again

## Troubleshooting

### Comments Not Appearing

- Check WebSocket connection status
- Verify JWT token is valid
- Ensure draft ID is correct
- Try refreshing the comment list

### Real-Time Updates Not Working

- Check browser console for WebSocket errors
- Verify server is running with WebSocket support
- Check network tab for WebSocket connection
- Ensure client-side WebSocket listener is integrated

### Comment Highlights Not Showing

- This is a known limitation (see AC11 in checklist)
- Full decorator implementation needed
- Workaround: Use sidebar to navigate to comments

### Position Tracking Issues

- Known limitation (see AC11 in checklist)
- Extensive edits may cause comment positions to drift
- Solution: Integrate Yjs position tracking

## Performance Tips

### For Large Documents

- Use pagination for comment threads
- Implement virtual scrolling in sidebar
- Lazy load comment content

### For Many Comments

- Filter by author or date range
- Use search functionality
- Group by section/paragraph

### For Real-Time Collaboration

- Debounce position updates
- Batch WebSocket messages
- Use optimistic updates

## Security Considerations

### Authentication

- All API endpoints require JWT token
- Token passed via Authorization header
- WebSocket requires token in query param

### Authorization

- Only authors can edit/delete their comments
- All authenticated users can resolve threads
- Firm-level isolation not required (draft-level only)

### Data Validation

- Content limited to 5000 characters
- Selection ranges validated
- XSS protection via React's default escaping

## Support

For issues or questions:
1. Check STORY-4.7-CHECKLIST.md for known limitations
2. Review story-4.7-implementation-summary.md for architecture details
3. Consult architecture.md for overall system design
4. Contact development team

## Changelog

### v1.0.0 (2025-11-11)

- Initial implementation
- Comment creation and display
- Threaded conversations
- Resolution workflow
- Edit and delete
- Real-time updates (server-side)
- Comprehensive testing

### Planned Enhancements

- Context menu for comments
- Comment search
- @mentions
- Email notifications
- Comment analytics
