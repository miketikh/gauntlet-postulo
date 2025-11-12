# AI Refinement UI Integration Guide

## Story 5.1: Design AI Refinement UI with Section Selection

This document demonstrates how to integrate the AI refinement functionality into the editor.

## Components Created

### 1. RefinementPanel (`refinement-panel.tsx`)
A sidebar panel that displays selected text and allows users to refine it with AI using:
- **Quick Actions**: Preset refinement buttons (Make More Assertive, Add More Detail, etc.)
- **Custom Instructions**: Free-form textarea for custom refinement requests

### 2. RefinementContextMenuPlugin (`plugins/refinement-context-menu-plugin.tsx`)
A Lexical plugin that adds a context menu (right-click menu) with a "Refine with AI" option when text is selected.

### 3. Updated EditorSidebar (`editor-sidebar.tsx`)
The sidebar now includes a "Refine" tab that shows the refinement panel.

### 4. Updated RichTextEditor (`rich-text-editor.tsx`)
The editor now supports the refinement context menu plugin.

## Integration Example

Here's a complete example of how to use the refinement UI in a collaborative editor page:

```tsx
'use client';

import React, { useState } from 'react';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { EditorSidebar } from '@/components/editor/editor-sidebar';
import { EditorLayout } from '@/components/editor/editor-layout';
import { EditorTopBar } from '@/components/editor/editor-top-bar';

export default function DraftEditorWithRefinement({ draftId }: { draftId: string }) {
  // Refinement state
  const [refinementSelectedText, setRefinementSelectedText] = useState('');
  const [isRefinementPanelOpen, setIsRefinementPanelOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Handle "Refine with AI" from context menu
  const handleRefineWithAI = (selectedText: string) => {
    setRefinementSelectedText(selectedText);
    setIsRefinementPanelOpen(true);
  };

  // Handle refinement request
  const handleRefine = async (instruction: string, quickActionId?: string) => {
    setIsRefining(true);

    try {
      // Call refinement API endpoint (to be implemented in Story 5.3)
      const response = await fetch('/api/ai/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          sectionText: refinementSelectedText,
          instruction,
          quickActionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Refinement failed');
      }

      // Handle streaming response (Story 5.3)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let refinedText = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content') {
              refinedText += data.text;
            } else if (data.type === 'done') {
              // Show preview (Story 5.4)
              console.log('Refinement complete:', refinedText);
            }
          }
        }
      }
    } catch (error) {
      console.error('Refinement error:', error);
    } finally {
      setIsRefining(false);
    }
  };

  // Handle close refinement panel
  const handleCloseRefinement = () => {
    setIsRefinementPanelOpen(false);
    setRefinementSelectedText('');
  };

  return (
    <EditorLayout
      topBar={
        <EditorTopBar
          projectTitle="Personal Injury Case"
          lastSaved={new Date()}
          saveStatus="saved"
        />
      }
      leftPanel={
        <div className="p-4">
          <h3 className="font-semibold mb-2">Source Documents</h3>
          {/* Source documents list */}
        </div>
      }
      centerPanel={
        <RichTextEditor
          editable={true}
          placeholder="Start writing your demand letter..."
          onRefineWithAI={handleRefineWithAI}
          refinementEnabled={true}
        />
      }
      rightPanel={
        <EditorSidebar
          draftId={draftId}
          currentUser={{ id: '1', name: 'John Doe', email: 'john@example.com' }}
          remoteUsers={[]}
          commentThreads={[]}
          refinementSelectedText={refinementSelectedText}
          isRefinementPanelOpen={isRefinementPanelOpen}
          onCloseRefinementPanel={handleCloseRefinement}
          onRefine={handleRefine}
          isRefining={isRefining}
        />
      }
    />
  );
}
```

## User Flow

1. **User selects text in editor**
   - User highlights a section of text they want to refine

2. **User right-clicks to open context menu**
   - Context menu appears with "Refine with AI" option

3. **User clicks "Refine with AI"**
   - Refinement panel opens in the sidebar
   - Selected text is displayed with character/word count

4. **User chooses refinement method**
   - **Quick Actions**: Click a preset button (e.g., "Make More Assertive")
   - **Custom Instructions**: Switch to custom tab and type instructions

5. **User clicks "Apply Refinement"**
   - AI processes the request (Story 5.3)
   - Refinement streams back (Story 5.3)
   - Preview shows original vs. refined text (Story 5.4)

6. **User reviews and applies/discards**
   - Apply: Replace selected text with refined version (Story 5.4)
   - Discard: Close panel without changes
   - Refine Again: Modify instructions and re-run

## Acceptance Criteria Status

✅ AC1: Users can select text in editor and right-click to open context menu
✅ AC2: Context menu includes "Refine with AI" option
✅ AC3: Clicking "Refine with AI" opens refinement panel with selected text highlighted
✅ AC4: Refinement panel shows selected text content and length (character/word count)
✅ AC5: Panel includes two modes: "Quick Actions" (preset buttons) and "Custom Instructions" (free-form text)
✅ AC6: Quick Actions displayed as prominent buttons
✅ AC7: Custom Instructions includes textarea with placeholder: "Describe how to improve this section..."
✅ AC8: "Apply Refinement" button triggers AI processing
✅ AC9: User can cancel refinement and return to editing
✅ AC10: Panel is accessible and keyboard-navigable

## Quick Actions Implemented

1. **Make More Assertive** (🔥)
   - Strengthen language and emphasize demands

2. **Add More Detail** (➕)
   - Expand content with additional context

3. **Shorten This Section** (✂️)
   - Condense content while preserving key points

4. **Emphasize Liability** (⚖️)
   - Highlight defendant's responsibility

5. **Soften Tone** (💗)
   - Make language more conciliatory

6. **Improve Clarity** (👁️)
   - Simplify complex language

## Keyboard Shortcuts

- **Escape**: Close refinement panel
- **Cmd/Ctrl + Enter**: Apply refinement
- **Tab**: Navigate between elements
- **Arrow keys**: Navigate quick action buttons

## Accessibility Features

- All buttons have `aria-label` attributes
- Context menu is keyboard accessible
- Quick actions have tooltips explaining their purpose
- Word/character count badges for screen readers
- Proper focus management
- Keyboard shortcuts for common actions

## Next Steps (Future Stories)

- **Story 5.2**: Implement backend prompt engineering for quick actions
- **Story 5.3**: Create `/api/ai/refine` endpoint with streaming support
- **Story 5.4**: Build preview UI showing original vs. refined text side-by-side
- **Story 5.5**: Track refinement history in database
- **Story 5.6**: Add context preservation across multiple refinements

## Testing

See test files:
- `components/editor/__tests__/refinement-panel.test.tsx`
- `components/editor/plugins/__tests__/refinement-context-menu-plugin.test.tsx`

## Architecture Alignment

This implementation follows the architecture patterns defined in `/docs/architecture.md`:

- Uses shadcn/ui components for consistency
- Follows component-based UI patterns
- Integrates with existing Lexical editor
- Prepared for SSE streaming (Story 5.3)
- Supports accessibility (WCAG 2.1 AA)
- Uses TypeScript for type safety
