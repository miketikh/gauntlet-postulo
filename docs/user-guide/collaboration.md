# Collaboration Guide

## Overview

Steno enables real-time collaboration so multiple team members can work on demand letters simultaneously. Changes sync instantly, and you can see who's viewing or editing at any moment.

---

## Real-Time Editing

### How It Works

Steno uses CRDT (Conflict-Free Replicated Data Type) technology powered by Yjs to synchronize changes:

- Changes appear within milliseconds
- No "save" button needed - everything auto-saves
- Conflicts resolved automatically
- Works even with multiple simultaneous editors

### Who Can See My Changes?

- All users with access to the project see changes in real-time
- Changes sync when connected to internet
- Offline changes sync automatically when reconnected

---

## Presence Awareness

### Seeing Who's Online

**Presence Indicators** show who's currently viewing or editing:

1. Look at top-right corner of editor
2. User avatars appear with colored borders
3. Hover over avatar to see:
   - User name
   - Current activity (viewing/editing)
   - Last active time

**Color Coding:**
- **Green**: Actively editing now
- **Yellow**: Viewing but not editing
- **Gray**: Idle (no recent activity)

### Cursor Tracking

When colleagues are editing:
- Their cursor position is shown with their name/color
- See what section they're working on
- Avoid editing the same area simultaneously

---

## Adding Comments

### Creating Comments

**Method 1: Context Menu**
1. Select text you want to comment on
2. Right-click
3. Choose "Add Comment"
4. Type your comment
5. Click "Post"

**Method 2: Comment Button**
1. Select text
2. Click comment icon in toolbar
3. Type and post

### Comment Thread Features

- **Reply**: Respond to comments
- **Edit**: Modify your own comments
- **Delete**: Remove your comments
- **Resolve**: Mark thread as resolved

### @Mentions (Coming Soon)

Future feature will allow:
- @mention colleagues by name
- Automatic notifications
- Direct someone's attention to specific sections

---

## Resolving Comments

### When to Resolve

- Issue has been addressed
- Question has been answered
- Suggestion has been implemented or rejected

### How to Resolve

1. Click on the comment thread
2. Review discussion
3. Click "Resolve" button
4. Comment thread collapses but remains in history

### Viewing Resolved Comments

1. Open Comments sidebar
2. Toggle "Show Resolved"
3. View all historical comment threads

---

## Version History and Snapshots

### Automatic Snapshots

Steno automatically creates snapshots at key milestones:
- Initial AI generation
- After major edits (every 50+ changes)
- Before restoring previous versions

### Manual Snapshots

Create version checkpoints yourself:

1. Click **Versions** in right sidebar
2. Click "Create Snapshot"
3. Add description: "After attorney review" or "Pre-settlement version"
4. Snapshot saved

### Viewing Version History

1. Click **Versions** tab
2. See chronological list of snapshots
3. View details:
   - Version number
   - Who created it
   - Date and time
   - Description
   - Change summary

### Comparing Versions

1. Select two versions to compare
2. Click "Compare"
3. Diff view shows:
   - **Green**: Added text
   - **Red**: Removed text
   - **Unchanged**: Black text

### Restoring Previous Versions

**Caution**: This replaces current content.

1. Select version to restore
2. Click "Restore This Version"
3. Confirm action
4. Current version becomes new snapshot
5. Selected version becomes active content

---

## Permissions and Sharing

### Permission Levels

**Viewer:**
- Read-only access
- Can view content
- Can add comments
- Cannot edit content

**Editor:**
- Full edit access
- Can modify content
- Can add comments
- Can create versions

**Owner:**
- All editor permissions
- Can delete project
- Can manage collaborators

### Adding Collaborators

1. Open project
2. Click "Share" button
3. Enter colleague's email
4. Select permission level
5. Click "Add"
6. They'll receive email notification

### Removing Collaborators

1. Click "Share" button
2. Find user in list
3. Click "Remove"
4. Their access is revoked immediately

---

## Collaboration Best Practices

### Before You Start

1. **Communicate**: Let team know what section you're editing
2. **Check Presence**: See if others are actively editing
3. **Create Snapshot**: Make version checkpoint before major changes
4. **Review History**: Check recent changes to stay in sync

### While Editing

1. **Watch Cursors**: Avoid editing same section as colleague
2. **Use Comments**: Ask questions rather than making assumptions
3. **Small Commits**: Make frequent, small changes
4. **Stay Connected**: Ensure stable internet connection

### After Editing

1. **Notify Team**: Use comments to alert others of changes
2. **Create Snapshot**: Mark significant milestones
3. **Resolve Comments**: Address comments directed at you
4. **Review Others' Changes**: Check what colleagues added

---

## Conflict Resolution

### How Conflicts Are Prevented

Steno's CRDT technology automatically merges changes:
- Character-level synchronization
- Last-write-wins for same text
- Preserves both users' formatting
- No manual conflict resolution needed

### If Content Seems Wrong

1. Refresh the browser
2. Check version history for unexpected changes
3. Use diff view to see what changed
4. Restore previous version if needed
5. Contact colleague who made changes

---

## Offline Editing

### Working Without Internet

**Limited Support:**
- Recent content cached locally
- Can view cached content
- Cannot edit while offline
- Changes don't sync until reconnected

**When Reconnected:**
- Cached changes sync automatically
- Conflicts resolved by CRDT
- You'll see any changes others made

### Best Practice

- Avoid offline editing for collaborative documents
- Create personal copy if extended offline work needed
- Check for updates after reconnecting

---

## Communication Features

### In-App Communication

**Comments:**
- Primary collaboration tool
- Attach to specific text
- Threaded discussions
- Resolve when complete

**Activity Log:**
- View recent changes
- See who did what
- Track document evolution

### External Communication

Coordinate outside Steno for:
- Strategy discussions
- Client communications
- Complex decision-making
- Urgent notifications

---

## Collaboration Scenarios

### Scenario 1: Attorney-Paralegal Workflow

**Paralegal:**
1. Creates project
2. Uploads source documents
3. Generates initial AI draft
4. Adds comment: "@Attorney - Ready for review"

**Attorney:**
1. Receives notification
2. Reviews draft
3. Makes edits and refinements
4. Adds comments with specific requests
5. Creates snapshot: "Reviewed by attorney"

**Paralegal:**
1. Addresses attorney's comments
2. Makes requested changes
3. Resolves comments
4. Creates snapshot: "Final draft"
5. Exports to Word

### Scenario 2: Multi-Attorney Review

**Primary Attorney:**
1. Generates draft
2. Shares with co-counsel
3. Adds comment: "Please review liability section"

**Co-Counsel:**
1. Opens project
2. Reviews liability section
3. Adds refinements
4. Replies to comment with thoughts

**Both:**
1. Discuss via comments
2. Make simultaneous edits to different sections
3. Primary attorney makes final decisions
4. Create version: "Final after co-counsel review"

### Scenario 3: Emergency Edits

**Situation**: Deadline approaching, urgent changes needed

1. Both attorneys open same project
2. Coordinate via phone/Slack: "I'll do intro, you do damages"
3. Edit different sections simultaneously
4. Changes sync in real-time
5. Quick review of each other's work
6. Export immediately

---

## Troubleshooting

### Changes Not Syncing

**Solutions:**
- Check internet connection
- Refresh browser
- Clear browser cache
- Check if someone else is editing
- Verify you have edit permissions

### Can't See Colleague's Cursor

**Solutions:**
- Ensure presence feature is enabled
- Refresh browser
- Check colleague is actually editing (not just viewing)
- Verify they're on the same document

### Comments Not Appearing

**Solutions:**
- Refresh page
- Check Comments sidebar is open
- Verify comment was posted (not draft)
- Check "Show Resolved" if comment was resolved

---

## Related Documentation

- [Getting Started Guide](./getting-started.md)
- [Version History Details](../features/version-history.md)
- [Admin Guide - User Management](../admin-guide/index.md#user-management)

---

## Support

Questions about collaboration?
- Email: support@steno.com
- See: [Troubleshooting Guide](../troubleshooting.md)
