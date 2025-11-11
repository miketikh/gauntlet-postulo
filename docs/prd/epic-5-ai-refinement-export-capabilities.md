# Epic 5: AI Refinement & Export Capabilities

**Expanded Goal:** Empower attorneys to iteratively improve AI-generated demand letter content through targeted refinement requests, and export finalized documents to Microsoft Word format for official use. This epic closes the loop on the end-to-end workflow (upload → generate → collaborate → refine → export), transforming rough AI drafts into polished, attorney-approved legal documents. Refinement tools must balance ease of use (one-click quick actions) with flexibility (custom natural language instructions), while export functionality must preserve all formatting, structure, and legal document conventions required for professional correspondence.

---

## Story 5.1: Design AI Refinement UI with Section Selection

As an **attorney**,
I want to select specific sections of my draft for AI refinement,
so that I can improve targeted parts without regenerating the entire document.

### Acceptance Criteria

1. Users can select text in editor and right-click to open context menu
2. Context menu includes "Refine with AI" option
3. Clicking "Refine with AI" opens refinement panel with selected text highlighted
4. Refinement panel shows selected text content and length (character/word count)
5. Panel includes two modes: "Quick Actions" (preset buttons) and "Custom Instructions" (free-form text)
6. Quick Actions displayed as prominent buttons (see Story 5.2 for specific actions)
7. Custom Instructions includes textarea with placeholder: "Describe how to improve this section..."
8. "Apply Refinement" button triggers AI processing
9. User can cancel refinement and return to editing
10. Panel is accessible and keyboard-navigable

**Prerequisites:** Story 4.1 (rich text editor), Story 2.6 (Claude API)

---

## Story 5.2: Implement Quick Action Refinement Buttons

As an **attorney**,
I want preset quick actions for common refinements,
so that I can quickly improve content without writing custom instructions.

### Acceptance Criteria

1. Quick Actions available in refinement panel:
   - **"Make More Assertive"**: Strengthen language, emphasize demands
   - **"Add More Detail"**: Expand content with additional context
   - **"Shorten This Section"**: Condense content while preserving key points
   - **"Emphasize Liability"**: Highlight defendant's responsibility
   - **"Soften Tone"**: Make language more conciliatory
   - **"Improve Clarity"**: Simplify complex language
   - **"Add Legal Citations"** (optional): Suggest relevant case law or statutes
2. Each button displays helpful tooltip explaining action
3. Clicking button populates refinement instruction automatically
4. User can edit auto-populated instruction before applying
5. Instructions optimized for Claude API based on testing
6. Quick actions tested with sample text to ensure quality outputs
7. UI shows which quick action was used in refinement history
8. Quick actions can be favorited/pinned by user (optional)
9. Analytics track which quick actions are most used

**Prerequisites:** Story 5.1 (refinement UI)

---

## Story 5.3: Implement Custom Prompt Refinement API

As a **developer**,
I want an API endpoint for AI refinement of text selections,
so that frontend can request targeted content improvements.

### Acceptance Criteria

1. `POST /api/ai/refine` endpoint accepts: `{ draftId, sectionText, instruction, context }`
2. Endpoint constructs prompt combining: original text, user instruction, document context (template type, case facts)
3. Prompt instructs Claude to return only refined text (not explanations or alternatives)
4. Claude API called with appropriate model (Claude 3.5 Sonnet) and streaming enabled
5. Refinement response streamed to client via Server-Sent Events
6. Token usage tracked and logged for analytics
7. Refinement record created in `ai_refinements` table: draft ID, instruction, original text, result, timestamp, applied status
8. Endpoint returns refinement ID and streamed content
9. Error handling for API failures with user-friendly messages
10. Rate limiting prevents excessive refinement requests (e.g., max 10/minute per user)
11. Unit tests verify prompt construction logic
12. Integration test mocks Claude API and verifies refinement flow

**Prerequisites:** Story 2.6 (Claude API integration), Story 5.1 (refinement UI)

---

## Story 5.4: Build Refinement Preview and Apply/Discard UI

As an **attorney**,
I want to preview AI-refined content before applying it,
so that I can ensure quality before replacing my original text.

### Acceptance Criteria

1. After refinement generation completes, preview panel displays side-by-side comparison:
   - Left: Original text
   - Right: Refined text
2. Differences highlighted (added text in green, removed text in strikethrough red)
3. "Apply Changes" button replaces selected text in editor with refined version
4. "Discard" button closes preview without changes
5. "Refine Again" button allows re-running with modified instructions
6. Preview includes metadata: refinement date, instruction used, token count
7. Applying changes creates undo point (Ctrl+Z can revert)
8. Refinement marked as "applied" in database
9. Discarded refinements saved in history but marked as "discarded"
10. Preview accessible via keyboard (Tab to navigate, Enter to apply, Esc to discard)

**Prerequisites:** Story 5.3 (refinement API), Story 5.1 (refinement UI)

---

## Story 5.5: Implement Refinement History Tracking

As an **attorney**,
I want to see history of all refinements I've requested,
so that I can review previous AI suggestions and reuse successful patterns.

### Acceptance Criteria

1. `GET /api/drafts/:id/refinements` endpoint returns list of all refinements for draft
2. Refinement history includes: timestamp, section refined, instruction, result, applied status, user who requested
3. History accessible from editor sidebar "Refinement History" tab
4. History displays in reverse chronological order (newest first)
5. Clicking history item shows preview of original vs. refined text
6. User can re-apply historical refinement to current selection
7. User can copy instruction from history to reuse with different text
8. Refinement statistics displayed: total refinements, most-used quick actions
9. History searchable by instruction text
10. Unit tests verify history retrieval logic
11. Integration test verifies refinement history displays correctly

**Prerequisites:** Story 5.4 (preview UI), Story 5.3 (refinement API)

---

## Story 5.6: Implement Context Preservation Across Refinements

As a **developer**,
I want refinements to preserve document context,
so that AI understands case facts and maintains consistency across iterations.

### Acceptance Criteria

1. Refinement API retrieves full draft content and case metadata (plaintiff, defendant, incident details)
2. Prompt includes context: "This is a {template type} demand letter for {plaintiff} vs. {defendant}..."
3. Previous refinements on same section included in prompt: "User previously asked to make this more assertive..."
4. Claude instructed to maintain consistency with document tone and facts
5. Context window managed: if draft too long, summarize or extract relevant sections
6. Token usage optimized: context kept under 2,000 tokens, target text under 1,000 tokens
7. Refinement quality tested with multi-iteration scenarios (refine → refine again)
8. Unit tests verify context construction logic
9. Integration test verifies iterative refinements maintain coherence

**Prerequisites:** Story 5.3 (refinement API), Story 2.7 (prompt engineering)

---

## Story 5.7: Implement Word Document Export (.docx Generation)

As a **developer**,
I want to generate Word documents from editor content,
so that attorneys can download finalized demand letters in professional format.

### Acceptance Criteria

1. Export library installed (e.g., `docx` npm package or similar)
2. `POST /api/drafts/:id/export` endpoint generates .docx file from draft content
3. Rich text formatting preserved: bold, italic, underline, headings, lists
4. Document structure includes:
   - Firm letterhead (if configured in template)
   - Page numbers in footer
   - Proper legal document margins (1" all sides)
   - Professional fonts: Times New Roman or similar serif font
5. Variables replaced with actual values (plaintiff name, demand amount, etc.)
6. Export includes metadata: creation date, version number, author
7. Generated file stored temporarily in S3 or returned as direct download
8. Endpoint returns presigned S3 URL for download (or file stream)
9. Export completes within 5 seconds for typical document
10. Unit tests verify document structure generation
11. Integration test verifies exported .docx file opens correctly in Microsoft Word

**Prerequisites:** Story 4.1 (rich text editor with content), Story 3.2 (template data)

---

## Story 5.8: Build Export Preview and Download UI

As an **attorney**,
I want to preview the exported document before downloading,
so that I can verify formatting and content are correct.

### Acceptance Criteria

1. "Export to Word" button in editor top bar opens export modal
2. Export modal displays document preview (rendered HTML mimicking Word styling)
3. Preview shows: all content, formatting, page breaks, headers/footers
4. Export options available:
   - File format: .docx (Word) - PDF in future enhancement
   - Include comments: Yes/No toggle
   - Filename: Editable text field with auto-generated default
5. "Download" button triggers export and downloads file
6. Download progress indicator shows during generation
7. Success message displays: "Document exported successfully. Opening download..."
8. "Email Export" button (optional) allows sending document via email
9. Export history tracked: timestamp, format, downloaded by user
10. Mobile-responsive export modal

**Prerequisites:** Story 5.7 (export generation), Story 4.10 (editor layout)

---

## Story 5.9: Implement Export Formatting with Letterhead and Styling

As an **attorney**,
I want exported documents to include firm letterhead and professional styling,
so that letters meet our firm's presentation standards.

### Acceptance Criteria

1. Firm settings include letterhead configuration:
   - Firm logo (image upload)
   - Firm name, address, phone, email
   - Letter header layout (left-aligned, centered, or right-aligned)
2. Template settings include styling preferences:
   - Font family (Times New Roman, Arial, Calibri)
   - Font size (10pt, 11pt, 12pt)
   - Line spacing (single, 1.5, double)
   - Paragraph spacing
3. Export applies letterhead to first page header
4. Subsequent pages include abbreviated header with firm name and page number
5. Signature block formatted correctly at document end
6. Table of contents auto-generated for multi-section documents (optional)
7. Export preview accurately reflects final Word document appearance
8. Firm admin can customize letterhead via Settings page
9. Multiple letterhead templates supported per firm (optional)
10. Unit tests verify letterhead application logic

**Prerequisites:** Story 5.7 (export generation), Story 3.2 (template system)

---

## Story 5.10: Implement Version Tagging in Exported Documents

As an **attorney**,
I want exported documents tagged with version information,
so that I can track which version was sent to whom.

### Acceptance Criteria

1. Exported document includes metadata in Word file properties:
   - Title: Case name
   - Author: User who exported
   - Company: Firm name
   - Subject: "Demand Letter - {Case Number}"
   - Comments: "Version {X}, Exported on {Date}"
2. Footer includes discrete version tag: "v1.3 - 2025-11-10"
3. Export creates database record in `draft_exports` table: draft ID, version number, exported by, timestamp, format
4. `GET /api/drafts/:id/exports` returns list of all exports
5. Export history accessible from editor: "View Export History" link
6. Version numbering auto-increments: v1.0, v1.1, v1.2, etc.
7. Major versions (v2.0) can be manually triggered (indicates significant changes)
8. Export includes disclaimer footer: "This document generated by Steno Demand Letter Generator"
9. Unit tests verify version tagging logic
10. Integration test verifies Word document properties contain correct metadata

**Prerequisites:** Story 5.7 (export generation), Story 2.9 (version history)

---

## Story 5.11: Implement Email Export Option

As an **attorney**,
I want to email exported documents directly from the application,
so that I can send demand letters without downloading first.

### Acceptance Criteria

1. Export modal includes "Send via Email" option
2. Email form includes fields: recipient email(s), subject line, message body
3. Subject line auto-populated: "Demand Letter - {Case Name}"
4. Message body includes professional template: "Please find attached the demand letter for {Case Name}..."
5. Exported Word document attached to email automatically
6. Email sent via email service (AWS SES or SendGrid)
7. Sender email is user's email address (or firm's no-reply email)
8. Confirmation message: "Email sent successfully to {recipient}"
9. Email record tracked in database: draft ID, recipient, timestamp, sent by user
10. `GET /api/drafts/:id/emails` returns email send history
11. Failed email sends show error message with retry option
12. Unit tests verify email payload construction
13. Integration test mocks email service and verifies send flow

**Prerequisites:** Story 5.8 (export UI), Story 5.7 (export generation), infrastructure for email service (AWS SES or SendGrid)
