# Story 5.1: Design AI Refinement UI with Section Selection

**Epic:** 5 - AI Refinement & Export Capabilities
**Track:** A - AI Refinement (Stories 5.1-5.6)
**Status:** Complete ✅
**Developer:** Dev-5A
**Completed:** 2025-11-11

---

## Story Description

As an **attorney**, I want to select specific sections of my draft for AI refinement, so that I can improve targeted parts without regenerating the entire document.

---

## Acceptance Criteria

- [x] **AC1:** Users can select text in editor and right-click to open context menu
- [x] **AC2:** Context menu includes "Refine with AI" option
- [x] **AC3:** Clicking "Refine with AI" opens refinement panel with selected text highlighted
- [x] **AC4:** Refinement panel shows selected text content and length (character/word count)
- [x] **AC5:** Panel includes two modes: "Quick Actions" (preset buttons) and "Custom Instructions" (free-form text)
- [x] **AC6:** Quick Actions displayed as prominent buttons (see Story 5.2 for specific actions)
- [x] **AC7:** Custom Instructions includes textarea with placeholder: "Describe how to improve this section..."
- [x] **AC8:** "Apply Refinement" button triggers AI processing
- [x] **AC9:** User can cancel refinement and return to editing
- [x] **AC10:** Panel is accessible and keyboard-navigable

**Prerequisites:** Story 4.1 (rich text editor) ✅ Complete, Story 2.6 (Claude API) ✅ Complete

---

## Implementation Summary

### Components Created

#### 1. RefinementPanel (`/components/editor/refinement-panel.tsx`)

Main UI component for AI refinement with two modes:

**Quick Actions Mode:**
- 6 preset refinement buttons with icons and tooltips
- "Make More Assertive" - Strengthen language, emphasize demands
- "Add More Detail" - Expand content with additional context
- "Shorten This Section" - Condense while preserving key points
- "Emphasize Liability" - Highlight defendant's responsibility
- "Soften Tone" - Make language more conciliatory
- "Improve Clarity" - Simplify complex language

**Custom Instructions Mode:**
- Free-form textarea for custom refinement requests
- Placeholder text guides users
- Real-time validation

**Features:**
- Selected text display with scroll area
- Word and character count badges
- Tabbed interface for mode switching
- Apply/Cancel buttons
- Keyboard shortcuts (Esc to cancel, Cmd/Ctrl+Enter to apply)
- Loading state during refinement
- Full ARIA labels and accessibility support

**Props:**
```typescript
interface RefinementPanelProps {
  selectedText: string;
  isOpen: boolean;
  onClose: () => void;
  onRefine: (instruction: string, quickActionId?: string) => void;
  isRefining?: boolean;
  className?: string;
}
```

#### 2. RefinementContextMenuPlugin (`/components/editor/plugins/refinement-context-menu-plugin.tsx`)

Lexical editor plugin that adds custom context menu:

**Features:**
- Detects text selection in editor
- Shows context menu on right-click
- "Refine with AI" option with Sparkles icon
- Standard options (Copy, Cut, Paste) included
- Position at cursor location
- Auto-close on outside click
- Keyboard navigation support

**Props:**
```typescript
interface RefinementContextMenuPluginProps {
  onRefineWithAI: (selectedText: string) => void;
  enabled?: boolean;
}
```

#### 3. Updated EditorSidebar (`/components/editor/editor-sidebar.tsx`)

Added "Refine" tab to sidebar:

**Changes:**
- New "refinement" tab with Sparkles icon
- Tab automatically activates when refinement panel opens
- Visual indicator when panel is active
- Integrated RefinementPanel component

**New Props:**
```typescript
{
  refinementSelectedText?: string;
  isRefinementPanelOpen?: boolean;
  onCloseRefinementPanel?: () => void;
  onRefine?: (instruction: string, quickActionId?: string) => void;
  isRefining?: boolean;
}
```

#### 4. Updated RichTextEditor (`/components/editor/rich-text-editor.tsx`)

Integrated refinement context menu:

**Changes:**
- Added RefinementContextMenuPlugin to plugin list
- New props for refinement callback
- Plugin only active when editor is editable

**New Props:**
```typescript
{
  onRefineWithAI?: (selectedText: string) => void;
  refinementEnabled?: boolean;
}
```

---

## Technical Implementation

### Architecture Alignment

✅ **shadcn/ui Components Used:**
- Button, Textarea, Tabs, Badge, Card, Tooltip, ScrollArea, DropdownMenu

✅ **Lexical Integration:**
- Custom plugin following Lexical patterns
- Proper use of `useLexicalComposerContext`
- Selection tracking with `$getSelection` and `$isRangeSelection`

✅ **TypeScript:**
- Strict typing throughout
- Proper interfaces for all props
- Type-safe quick action configuration

✅ **Accessibility (WCAG 2.1 AA):**
- All buttons have aria-labels
- Keyboard shortcuts documented
- Keyboard navigation support
- Proper focus management
- Tooltips explain quick actions

### Key Design Decisions

1. **Two-Mode Interface**
   - Quick Actions for common tasks (one-click)
   - Custom Instructions for flexibility
   - Users can switch modes or edit quick action instructions

2. **Context Menu Placement**
   - Right-click is familiar to desktop users
   - Position at cursor for convenience
   - Includes standard clipboard operations

3. **Sidebar Integration**
   - Refinement panel in sidebar (not modal/popover)
   - Keeps editor visible during refinement
   - Aligns with existing Comments/History tabs

4. **Text Stats Display**
   - Word and character count helps users gauge length
   - Useful for checking if "Shorten This Section" worked

5. **Keyboard Shortcuts**
   - Esc to cancel (standard close action)
   - Cmd/Ctrl+Enter to apply (follows AI chat UX patterns)

---

## File List

### Created Files
- `/components/editor/refinement-panel.tsx` - Main refinement UI component
- `/components/editor/plugins/refinement-context-menu-plugin.tsx` - Context menu plugin
- `/components/editor/__tests__/refinement-panel.test.tsx` - Unit tests for panel
- `/components/editor/plugins/__tests__/refinement-context-menu-plugin.test.tsx` - Plugin tests
- `/components/editor/REFINEMENT_INTEGRATION_EXAMPLE.md` - Integration guide
- `/docs/stories/story-5.1-ai-refinement-ui.md` - This file

### Modified Files
- `/components/editor/editor-sidebar.tsx` - Added refinement tab
- `/components/editor/rich-text-editor.tsx` - Integrated refinement plugin

---

## Testing

### Unit Tests

**RefinementPanel Tests:**
- ✅ Rendering with isOpen prop
- ✅ Selected text display
- ✅ Word/character count calculation
- ✅ Quick action buttons display
- ✅ Quick action selection
- ✅ Custom instruction input
- ✅ Apply/Cancel actions
- ✅ Keyboard shortcuts (Esc, Cmd+Enter)
- ✅ Disabled states during refinement
- ✅ Accessibility attributes

**RefinementContextMenuPlugin Tests:**
- ✅ Context menu appears on right-click with selected text
- ✅ No menu without text selection
- ✅ "Refine with AI" option displayed
- ✅ Standard clipboard options included
- ✅ Callback invoked with selected text
- ✅ Menu positioning at cursor
- ✅ Close on outside click
- ✅ Keyboard navigation support

### Manual Testing Checklist

- [x] Right-click selected text shows context menu
- [x] "Refine with AI" opens refinement panel
- [x] Selected text appears in panel
- [x] Word/character count is accurate
- [x] Quick Actions tab shows all 6 buttons
- [x] Clicking quick action populates instruction
- [x] Custom Instructions tab allows typing
- [x] Apply button triggers callback
- [x] Cancel button closes panel
- [x] Esc key closes panel
- [x] Cmd/Ctrl+Enter applies refinement
- [x] Sidebar "Refine" tab auto-activates
- [x] Refinement panel integrates with sidebar layout

---

## Integration Example

See `/components/editor/REFINEMENT_INTEGRATION_EXAMPLE.md` for complete usage example.

**Quick Example:**

```tsx
const [selectedText, setSelectedText] = useState('');
const [isPanelOpen, setIsPanelOpen] = useState(false);

<RichTextEditor
  onRefineWithAI={(text) => {
    setSelectedText(text);
    setIsPanelOpen(true);
  }}
  refinementEnabled={true}
/>

<EditorSidebar
  refinementSelectedText={selectedText}
  isRefinementPanelOpen={isPanelOpen}
  onCloseRefinementPanel={() => setIsPanelOpen(false)}
  onRefine={(instruction, quickActionId) => {
    // Call API (Story 5.3)
    console.log('Refine:', instruction, quickActionId);
  }}
/>
```

---

## Next Steps (Dependent Stories)

### Story 5.2: Implement Quick Action Refinement Buttons
- Add backend prompt engineering for each quick action
- Optimize instructions for Claude API
- Track which actions are most used (analytics)

### Story 5.3: Implement Custom Prompt Refinement API
- Create `POST /api/ai/refine` endpoint
- Build context-aware prompts
- Implement streaming with SSE
- Add rate limiting

### Story 5.4: Build Refinement Preview and Apply/Discard UI
- Side-by-side comparison (original vs. refined)
- Diff highlighting (green additions, red removals)
- Apply/Discard/Refine Again actions
- Undo support

### Story 5.5: Implement Refinement History Tracking
- `GET /api/drafts/:id/refinements` endpoint
- History sidebar tab
- Re-apply historical refinements
- Search and filter history

### Story 5.6: Implement Context Preservation Across Refinements
- Include case metadata in prompts
- Reference previous refinements
- Maintain document consistency
- Optimize token usage

---

## Known Limitations

1. **API Integration Pending** (Story 5.3)
   - UI is complete but not connected to backend
   - `onRefine` callback needs to call API endpoint
   - Streaming response handling needed

2. **Preview Not Implemented** (Story 5.4)
   - Currently just triggers callback
   - No diff view before applying
   - No undo support yet

3. **No History Tracking** (Story 5.5)
   - Refinements not saved to database
   - Cannot view past refinements
   - Cannot reuse successful patterns

4. **No Context Preservation** (Story 5.6)
   - Refinement prompt doesn't include document context
   - Doesn't reference case facts
   - No memory of previous refinements

---

## Performance Considerations

- Refinement panel only renders when `isOpen={true}`
- Context menu uses event delegation (single listener)
- Text selection tracked via Lexical's efficient selection API
- Word/character count computed on-demand (not reactive)

---

## Accessibility Features

✅ **Keyboard Navigation:**
- Tab through all controls
- Arrow keys navigate quick actions
- Esc closes panel
- Cmd/Ctrl+Enter applies

✅ **Screen Reader Support:**
- ARIA labels on all buttons
- Descriptive tooltips
- Word/character count announced
- Status updates during refinement

✅ **Visual Indicators:**
- Clear focus states
- Selected quick action highlighted
- Loading state shows "Refining..." text
- Keyboard shortcuts displayed

---

## Change Log

| Date | Developer | Changes |
|------|-----------|---------|
| 2025-11-11 | Dev-5A | Initial implementation - All ACs complete |

---

## Dev Agent Record

### Tasks Completed

- [x] Read existing AI service to understand Claude API integration
- [x] Design refinement panel UI component
- [x] Implement Quick Actions with 6 preset buttons
- [x] Implement Custom Instructions textarea mode
- [x] Add text selection tracking and stats display
- [x] Create Lexical context menu plugin
- [x] Integrate plugin into RichTextEditor
- [x] Add refinement tab to EditorSidebar
- [x] Write comprehensive unit tests
- [x] Create integration documentation
- [x] Verify keyboard navigation
- [x] Validate WCAG 2.1 AA compliance

### Completion Notes

This story provides the complete UI foundation for AI refinement. All acceptance criteria met:

1. ✅ Context menu on right-click with text selection
2. ✅ "Refine with AI" option visible and functional
3. ✅ Refinement panel opens in sidebar with selected text
4. ✅ Word and character count displayed accurately
5. ✅ Two modes: Quick Actions (6 buttons) and Custom Instructions
6. ✅ Quick Actions are prominent with icons and tooltips
7. ✅ Custom Instructions has textarea with placeholder
8. ✅ Apply button triggers `onRefine` callback
9. ✅ Cancel and X button close panel
10. ✅ Full keyboard navigation (Esc, Cmd+Enter, Tab, Arrow keys)

**Ready for:** Story 5.2 (Quick Action prompt engineering) and Story 5.3 (Refinement API endpoint)

**Blocking Issues:** None

**Tech Debt:** None identified

---

## Story Status: ✅ Complete

All acceptance criteria met. UI is fully functional and ready for backend integration.
