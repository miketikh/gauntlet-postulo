# User Interface Design Goals

## Overall UX Vision

The Demand Letter Generator should feel like a professional legal workspace that combines the familiarity of traditional document editing with the power of modern AI assistance. The interface prioritizes **clarity, efficiency, and confidence-building** for legal professionals who need to trust the tool with high-stakes documents.

The experience should follow a clear linear workflow for new letter creation (upload → template selection → AI generation → collaborative editing → export) while providing quick access to ongoing projects via a dashboard. Real-time collaboration should feel seamless and unobtrusive, with presence indicators and comments integrated naturally into the editing experience. AI capabilities should be discoverable but not overwhelming—attorneys should feel in control of the content at all times, with AI positioned as an intelligent assistant rather than an autonomous decision-maker.

The visual design should convey **professionalism, security, and trustworthiness** through clean typography, generous whitespace, and a color palette that aligns with legal industry expectations (navy, slate gray, white, with accent colors for interactive elements).

## Key Interaction Paradigms

1. **Progressive Disclosure:** Complex features like template management and advanced AI refinement are accessible but not cluttering the primary workflow. The main path (create letter → edit → export) is prominent and simplified.

2. **Side-by-Side Context:** When editing drafts, users see source documents alongside the draft editor in a split-screen layout. This allows attorneys to reference source materials without context-switching between windows.

3. **Streaming Feedback:** AI generation provides real-time streaming output with visual progress indicators, allowing users to see content being created rather than waiting for completion. This builds trust and reduces perceived wait time.

4. **Inline Refinement:** AI refinement actions are contextual—users can select text and trigger refinement on specific sections rather than regenerating entire documents. Quick action buttons appear on text selection.

5. **Non-blocking Collaboration:** Presence indicators show who's editing, but collaboration never locks sections or forces turn-taking. CRDT-based conflict resolution happens automatically in the background.

6. **Smart Defaults with Flexibility:** Templates provide structure, but users can always override AI suggestions or add manual content. The system suggests but never restricts.

## Core Screens and Views

1. **Dashboard / Projects List**
   - Central hub showing all demand letter projects (drafts in progress, completed, sent)
   - Filters by status, date, attorney, case number
   - Quick stats widget (letters this month, time saved estimate)
   - Prominent "New Demand Letter" CTA button
   - Recent activity feed showing team members' actions

2. **Document Upload Wizard**
   - Large drag-and-drop zone with visual feedback
   - Multi-file upload with batch processing
   - Document preview thumbnails with extracted text preview
   - Progress indicators for upload and text extraction
   - Template selection screen (gallery view of firm templates)

3. **Case Details Form**
   - Dynamic form based on selected template's variables
   - Fields for plaintiff/defendant names, incident date, demand amount, jurisdiction
   - Auto-save functionality to prevent data loss
   - Ability to save partial information and return later

4. **AI Generation View**
   - Full-screen focus mode during initial generation
   - Streaming text output with typewriter effect
   - Section-by-section progress indicators (Header → Facts → Damages → Demand)
   - Option to pause/stop generation if content is off-track

5. **Collaborative Editor (Primary Workspace)**
   - **Left Panel:** Tabbed source document viewer (switch between uploaded PDFs/docs)
   - **Center Panel:** Rich text editor with formatting toolbar (bold, italic, lists, headings)
   - **Right Sidebar (collapsible):**
     - Presence indicators (avatars of active users)
     - Comment threads panel
     - Version history drawer
   - **Floating AI Panel:** Quick refinement actions + custom prompt input
   - **Top Bar:** Project title, save status, "Export to Word" button, share/collaboration settings

6. **Template Builder/Manager**
   - Gallery view of all firm templates
   - Visual template editor with drag-and-drop section blocks
   - Section configuration panel (type: static/AI-generated/variable)
   - Variable definition interface (name, type, required/optional)
   - Live preview pane showing template with sample data
   - Version control for template iterations

7. **Settings / Admin Panel**
   - User management (for firm admins)
   - Firm-level settings (branding, default templates, security policies)
   - Usage analytics dashboard (letters generated, time savings, adoption metrics)
   - Billing and subscription management

8. **Export Preview**
   - Final preview of formatted document before export
   - Option to select export format (Word .docx initially, potentially PDF later)
   - Download or email options

## Accessibility: WCAG 2.1 AA

The application must meet WCAG 2.1 AA compliance standards, ensuring usability for attorneys with disabilities:

- **Keyboard Navigation:** All features accessible via keyboard shortcuts (tab navigation, arrow keys for lists, Ctrl+S for save, etc.)
- **Screen Reader Support:** Proper ARIA labels on all interactive elements, semantic HTML structure, alt text for icons
- **Color Contrast:** Minimum 4.5:1 contrast ratio for text, 3:1 for UI components
- **Focus Indicators:** Visible focus states on all interactive elements
- **Text Resizing:** Support for 200% zoom without loss of functionality
- **Alternative Input Methods:** Support for voice dictation and switch controls where applicable

## Branding

**Assumption:** Steno has existing brand guidelines that should be incorporated.

- **Typography:** Professional serif font for document content (mimicking legal documents), clean sans-serif for UI elements
- **Color Palette:**
  - Primary: Navy blue (#1E3A5F) for headers, primary actions
  - Secondary: Slate gray (#475569) for body text
  - Accent: Professional teal (#0891B2) or gold (#D97706) for interactive elements and success states
  - Semantic colors: Red for destructive actions, green for confirmations
- **Logo Placement:** Steno logo in top-left navigation, firm logos in generated document headers (configurable per firm)
- **Tone:** Professional, trustworthy, intelligent but not intimidating

## Target Device and Platforms: Desktop-First with Basic Mobile Responsiveness

**Primary Target:** Desktop browsers (Chrome, Firefox, Safari, Edge) on macOS and Windows
- Optimized for screen resolutions 1920x1080 and above
- Split-screen layouts and multi-panel views assume desktop real estate
- Keyboard shortcuts and hover interactions designed for desktop use

**Secondary Support:** Tablet and mobile browsers (iOS Safari, Chrome)
- **Tablets (iPad, Android tablets):** Functional editing interface with adapted layout (single-panel view instead of split-screen)
- **Mobile phones:**
  - View-only mode for reading drafts on the go
  - Light editing capabilities (text changes, comments)
  - Document upload via camera/photo library
  - Core features like template building and AI generation are desktop-only
  - Navigation simplified to hamburger menu

**Responsive Breakpoints:**
- Desktop: 1280px and above (full feature set)
- Tablet: 768px - 1279px (adapted layouts, full features)
- Mobile: Below 768px (limited features, view-focused)

**No native mobile apps** in MVP scope.
