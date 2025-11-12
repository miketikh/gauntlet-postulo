# Version History Guide

## Overview

Version History tracks all changes to your demand letters, allowing you to review past iterations, compare versions, and restore previous content if needed.

---

## How Version History Works

### Automatic Snapshots

Steno automatically creates version snapshots at key moments:
- Initial AI generation (v1)
- After major edits (every 50+ changes)
- Before restoring a previous version
- Before AI refinement operations

### Manual Snapshots

Create checkpoints yourself at important milestones:
- After completing a round of edits
- Before sharing with colleagues
- After attorney review
- Before finalizing for delivery

---

## Viewing Version History

### Access Version History

1. Open your project in the editor
2. Click **Versions** in the right sidebar
3. View chronological list of all snapshots

### Version Information

Each version shows:
- **Version Number**: v1, v2, v3, etc.
- **Created By**: User who created snapshot
- **Created At**: Date and time
- **Description**: Optional change summary
- **Changes**: Number of additions/deletions
- **Content Preview**: First few lines of content

### Sorting and Filtering

- **Sort by**: Date (newest first/oldest first)
- **Filter by User**: Show only specific user's versions
- **Search**: Find versions by description text

---

## Creating Snapshots

### Manual Snapshot

1. Click **Versions** tab
2. Click **Create Snapshot**
3. Add description (optional but recommended):
   - "After attorney review"
   - "Pre-settlement version"
   - "Incorporated medical records"
4. Click **Save Snapshot**

**Best Practice**: Add meaningful descriptions to track what changed.

### Automatic Snapshot Triggers

Snapshots created automatically when:
- Draft first generated
- 50 or more changes accumulated
- About to restore previous version
- Major AI refinement applied

---

## Comparing Versions

### Side-by-Side Comparison

1. Select version from history
2. Click **Compare to Current**
3. View diff display:
   - **Green text**: Added content
   - **Red text**: Removed content
   - **Black text**: Unchanged content

### Compare Any Two Versions

1. Click **Compare Versions**
2. Select "From" version
3. Select "To" version
4. View differences
5. Export comparison (optional)

### Understanding Diff View

**Example:**
```
The defendant failed to stop at the red light.
                    ^^^^^^^^^ removed

The defendant negligently failed to stop at the red light,
              ^^^^^^^^^^^ added
causing the collision.
^^^^^^^^^^^^^^^^^^^^^ added
```

---

## Restoring Previous Versions

### Restore Process

**Warning**: Restoring replaces current content. Create snapshot first!

1. View version history
2. Select version to restore
3. Click **Restore This Version**
4. Confirm action (current version saved automatically)
5. Selected version becomes active draft
6. Version number increments (current becomes new snapshot)

### What Happens When Restoring

- Current draft saved as new snapshot
- Selected version content becomes active
- Version number increments
- All history preserved (nothing deleted)
- Can undo by restoring the "current" snapshot

### Best Practice

Before restoring:
1. Review the version carefully
2. Compare with current to see what will change
3. Create snapshot of current version
4. Add description: "Before restore"
5. Then restore

---

## Use Cases

### Scenario 1: Undo Unwanted Changes

**Problem**: Made changes you want to revert

**Solution**:
1. View version history
2. Find last good version
3. Compare with current
4. Restore previous version
5. Unwanted changes removed

### Scenario 2: Track Client Requests

**Workflow**:
1. Initial draft: v1
2. After client feedback: Create snapshot "Client revisions 1"
3. After second review: Create snapshot "Client revisions 2"
4. Final version: Create snapshot "Final for delivery"

**Benefit**: Can show client exactly what changed at each stage.

### Scenario 3: Multiple Versions for Different Recipients

**Strategy**:
1. Create base version
2. Snapshot: "Base version"
3. Edit for insurance company: Snapshot "For insurance"
4. Restore base version
5. Edit for direct negotiation: Snapshot "For defendant direct"

**Result**: Two versions from same base, tracked separately.

### Scenario 4: Collaborative Editing

**Timeline**:
1. Paralegal creates draft: v1
2. Attorney reviews: Snapshot "Attorney review complete"
3. Partner reviews: Snapshot "Partner review complete"
4. Final edits: Snapshot "Final version"

**Benefit**: Track who reviewed when and what changed.

---

## Version Metadata

### Viewing Detailed Metadata

Click version to see:
- **Version Number**: Sequential number
- **Created By**: User name and email
- **Created At**: Exact timestamp
- **Description**: User-provided summary
- **Content Size**: Character/word count
- **Changes Since Previous**: Stats on modifications
- **Related Actions**: Exports, comments linked to version

### Version Statistics

Track how document evolved:
- Total versions created
- Average time between versions
- Most active contributors
- Total content growth
- Number of restorations

---

## Export Version History

### Export Specific Version

1. Select version from history
2. Click **Export This Version**
3. Choose format (.docx)
4. Version number included in filename
5. Download file

**Filename Format**: `ProjectName_v2_2024-11-10.docx`

### Export Comparison Report

1. Compare two versions
2. Click **Export Comparison**
3. PDF showing side-by-side diff
4. Use for client communication or internal review

---

## Version Retention

### How Long Versions Are Kept

- All versions retained indefinitely
- No automatic deletion
- Accessible even after project completion
- Part of compliance audit trail

### Storage Considerations

- Versions stored efficiently (delta compression)
- Minimal storage impact
- No user-facing storage limits

---

## Best Practices

### Creating Snapshots

**When to Create**:
- Before major structural changes
- After significant content additions
- Before sharing with others
- At end of each work session
- After incorporating feedback

**When NOT to Create**:
- After every minor edit (too many versions)
- For typo corrections
- During active drafting (wait for milestone)

### Naming Versions

**Good Descriptions**:
- "After attorney review - liability section strengthened"
- "Incorporated new medical records"
- "Pre-settlement negotiation version"
- "Final draft before delivery"

**Poor Descriptions**:
- "v2"
- "changes"
- "update"
- "final" (which final?)

### Version Strategy

**Small Projects** (quick turnaround):
- v1: Initial generation
- v2: After edits
- v3: Final version

**Large Projects** (multiple reviewers):
- v1: Initial generation
- v2: Paralegal edits complete
- v3: Attorney review complete
- v4: Partner review complete
- v5: Client feedback incorporated
- v6: Final pre-delivery version

---

## Troubleshooting

### Can't See Version History

**Problem**: Versions tab empty

**Solutions:**
- Check you're viewing the correct draft
- Refresh page
- Verify draft has been saved
- Contact support if still empty

### Restore Fails

**Problem**: Error when trying to restore version

**Solutions:**
- Check internet connection
- Verify you have edit permissions
- Try refreshing page
- Ensure no one else is editing simultaneously
- Contact support if problem persists

### Comparison Doesn't Load

**Problem**: Diff view shows error or blank

**Solutions:**
- Try comparing different versions
- Check versions are complete (not corrupted)
- Refresh page
- Clear browser cache
- Try in different browser

### Version Missing

**Problem**: Can't find expected version

**Solutions:**
- Check sort order (newest first?)
- Verify date range if filtered
- Search by description text
- Check if user filter is applied
- Contact admin if version truly missing

---

## Advanced Tips

### Version Branching Strategy

For complex projects with multiple paths:
1. Create "checkpoint" version at decision points
2. Test different approaches from same checkpoint
3. Compare results
4. Choose best version and continue from there

### Version Documentation

Add detailed descriptions:
```
Description:
"Version 3 - Changes:
- Added $15,000 in additional medical expenses from new records
- Strengthened liability section per attorney notes
- Softened tone per client request
- Added new witness statement from police report"
```

### Integration with Comments

Reference versions in comments:
```
Comment: "See version 2 for original liability language that was stronger. We may want to revert to that approach if negotiations stall."
```

---

## Related Documentation

- [Collaboration Guide](../user-guide/collaboration.md)
- [Getting Started](../user-guide/getting-started.md)
- [Export Guide](../user-guide/export-delivery.md)
