# Epic 3: Template Management System

**Expanded Goal:** Enable law firms to create, customize, and manage demand letter templates that define document structure, sections, and variables for AI generation. This epic delivers firm-specific customization capabilities that allow templates to enforce consistency, adhere to firm standards, and reduce setup time for future letters. Templates become a strategic asset—firms invest time in perfecting them, which increases product stickiness and creates switching costs. The system must support various section types (static boilerplate, AI-generated content, dynamic variables) and provide version control to track template evolution over time.

---

## Story 3.1: Design Template Data Model and Database Schema

As a **developer**,
I want a comprehensive template data model designed,
so that templates can represent complex document structures with flexibility.

### Acceptance Criteria

1. `templates` table created with fields: `id`, `firmId`, `name`, `description`, `isActive`, `createdBy`, `createdAt`, `updatedAt`
2. Template structure stored as JSONB field containing sections array and variables array
3. Section schema supports: `id`, `title`, `type` (static/ai_generated/variable), `content`, `promptGuidance`, `required`, `order`
4. Variable schema supports: `name`, `type` (text/number/date/currency), `required`, `defaultValue`
5. `template_versions` table created for version history: `id`, `templateId`, `versionNumber`, `structure`, `createdAt`, `createdBy`
6. Database migration script created and applied successfully
7. Prisma schema updated with template models and relationships
8. Foreign key constraints ensure `firmId` references `firms` table
9. Indexes added on `firmId` and `isActive` for query performance
10. Seed script creates 2 sample templates (Personal Injury, Contract Dispute)

**Prerequisites:** Story 1.4 (database setup), Story 1.10 (firm isolation)

---

## Story 3.2: Implement Template CRUD API Endpoints

As a **developer**,
I want RESTful API endpoints for template management,
so that frontend can create, read, update, and delete templates.

### Acceptance Criteria

1. `GET /api/templates` returns list of templates for authenticated user's firm
2. `GET /api/templates/:id` returns single template with full structure
3. `POST /api/templates` creates new template (validates structure schema)
4. `PUT /api/templates/:id` updates existing template (creates new version automatically)
5. `DELETE /api/templates/:id` soft-deletes template (sets `isActive: false`)
6. All endpoints enforce firm-level isolation (users can only access their firm's templates)
7. Validation ensures required fields present and section types valid
8. `GET /api/templates/:id/versions` returns version history
9. `POST /api/templates/:id/versions/:version/restore` restores previous version
10. Unit tests cover CRUD operations and validation logic
11. Integration tests verify firm isolation and version history

**Prerequisites:** Story 3.1 (data model), Story 1.10 (firm isolation)

---

## Story 3.3: Build Template Gallery View

As an **attorney**,
I want to see all available templates in a gallery view,
so that I can browse and select the appropriate template for my case.

### Acceptance Criteria

1. Templates page at `/templates` displays grid of template cards
2. Each card shows: template name, description, thumbnail preview, last modified date
3. Cards indicate template type via icon or badge (e.g., "Personal Injury", "Contract")
4. "New Template" button prominent at top-right (requires admin or attorney role)
5. Search box filters templates by name or description
6. Clicking template card opens template preview modal or navigates to detail view
7. "Use Template" button on card starts new project with selected template
8. Empty state displayed when no templates exist with CTA to create first template
9. Loading skeleton displayed while templates fetch
10. Mobile-responsive grid layout (1 column on mobile, 2-3 on tablet, 4+ on desktop)

**Prerequisites:** Story 3.2 (API endpoints), Story 1.11 (dashboard shell)

---

## Story 3.4: Build Template Builder UI - Section Management

As an **attorney**,
I want a visual template builder to define document sections,
so that I can structure demand letters according to firm standards.

### Acceptance Criteria

1. Template builder page at `/templates/new` and `/templates/:id/edit`
2. Form includes fields: template name, description, type/category
3. Section list displays all sections in order with drag-and-drop reordering
4. "Add Section" button opens section configuration modal
5. Section modal includes: section title, type dropdown (Static/AI Generated/Variable), required checkbox
6. Static sections have text editor for boilerplate content
7. AI Generated sections have textarea for prompt guidance instructions
8. Variable sections have variable selector (multi-select from defined variables)
9. Each section has edit and delete buttons
10. Section preview pane shows live rendering with sample data
11. Changes auto-save as draft (or explicit "Save Draft" button)
12. "Publish Template" button validates and saves as active template

**Prerequisites:** Story 3.3 (gallery view), Story 3.2 (API endpoints)

---

## Story 3.5: Build Template Builder UI - Variable Definition

As an **attorney**,
I want to define variables in my templates,
so that I can capture case-specific information dynamically.

### Acceptance Criteria

1. Template builder includes "Variables" tab or section
2. Variable list displays all defined variables with name, type, and required status
3. "Add Variable" button opens variable configuration modal
4. Variable modal includes: variable name (alphanumeric, no spaces), display label, type dropdown (Text/Number/Date/Currency), required checkbox, default value field
5. Variable types enforce appropriate validation (e.g., Currency shows as $X,XXX.XX)
6. Variable names use placeholder syntax: `{{variable_name}}`
7. Variables can be referenced in static section content via placeholders
8. Template preview replaces placeholders with sample data
9. Variable deletion shows warning if used in any sections
10. Variables can be reordered in definition list (affects form field order)

**Prerequisites:** Story 3.4 (section management)

---

## Story 3.6: Implement Template Validation and Publishing

As a **developer**,
I want template validation before publishing,
so that templates are structurally sound and usable.

### Acceptance Criteria

1. Validation checks: at least one section exists, all required fields completed, section types valid
2. Validation ensures variable names unique and follow naming rules (alphanumeric + underscores)
3. Validation checks AI-generated sections have prompt guidance (not empty)
4. Validation ensures static sections with variables reference only defined variables
5. Publish action creates new version in `template_versions` table
6. Published template marked as `isActive: true`
7. Previous active version remains in version history
8. Validation errors displayed in UI with clear messages and links to problematic sections
9. "Save as Draft" bypasses validation (allows incomplete templates)
10. Unit tests cover all validation rules
11. Integration test verifies publish workflow creates version

**Prerequisites:** Story 3.5 (variable definition), Story 3.2 (API endpoints)

---

## Story 3.7: Implement Template Preview with Sample Data

As an **attorney**,
I want to preview my template with sample data,
so that I can see how the final document will look before using it.

### Acceptance Criteria

1. Template builder includes "Preview" button or tab
2. Preview renders template structure with all sections in order
3. Static sections display actual content
4. AI-generated sections show placeholder text: "[AI will generate content based on: {prompt guidance}]"
5. Variables display sample values (e.g., "John Doe" for plaintiff_name, "$50,000" for demand_amount)
6. Preview includes option to input custom sample values for variables
7. Preview updates live as template sections are edited
8. Preview displays in document format (mimics final export styling)
9. "Print Preview" button allows printing preview for review
10. Preview accessible from both template builder and gallery view

**Prerequisites:** Story 3.6 (validation), Story 3.4 (section management)

---

## Story 3.8: Implement Template Versioning and History

As an **attorney**,
I want to track template versions,
so that I can see changes over time and restore previous versions if needed.

### Acceptance Criteria

1. Every template update creates new entry in `template_versions` table
2. Version numbers auto-increment (v1, v2, v3, etc.)
3. `GET /api/templates/:id/versions` returns list of all versions with metadata
4. Version list displays: version number, created date, created by user, change summary (optional)
5. Clicking version loads readonly preview of that version's structure
6. "Restore This Version" button copies version structure to new current version
7. Restored versions create new version number (not overwrite current)
8. Version history accessible from template detail page
9. Version diff view shows changes between versions (optional nice-to-have)
10. Unit tests verify version creation on update
11. Integration test verifies version restoration workflow

**Prerequisites:** Story 3.6 (publishing), Story 3.2 (API endpoints)

---

## Story 3.9: Implement Template Access Control and Sharing

As a **firm admin**,
I want to control which users can edit templates,
so that template integrity is maintained by authorized users only.

### Acceptance Criteria

1. Templates include `createdBy` field linking to user who created template
2. Template permissions: all firm members can view and use, only admins/attorneys can create/edit
3. `requireRole(['admin', 'attorney'])` middleware applied to POST/PUT/DELETE template endpoints
4. Paralegals can view templates and use them but cannot modify
5. Template detail page shows "Edit" button only for authorized users
6. Attempting unauthorized edit returns 403 Forbidden
7. Template audit log tracks who created/modified template (stored in version history)
8. Future enhancement noted for fine-grained permissions (template owners, shared edit access)
9. Unit tests verify role-based access control
10. Integration test verifies paralegal cannot edit template

**Prerequisites:** Story 1.9 (RBAC), Story 3.8 (versioning)

---

## Story 3.10: Seed Default Templates for Common Use Cases

As a **new user**,
I want sample templates available immediately,
so that I can start using the system without building templates from scratch.

### Acceptance Criteria

1. Database seed script creates 2-3 default templates for each firm
2. Templates include:
   - **Personal Injury Demand Letter**: Sections for facts, injuries, medical expenses, damages, demand
   - **Contract Dispute Demand Letter**: Sections for contract summary, breach details, damages, remedy sought
   - (Optional) **Property Damage Demand Letter**: Sections for incident description, property damage, repair costs, demand
3. Default templates marked as system templates (or flagged for easy identification)
4. Templates include well-crafted prompt guidance for AI-generated sections
5. Variables defined for each template type (plaintiff, defendant, incident date, amounts, etc.)
6. Seed script runs during initial database setup (`npm run db:seed`)
7. Templates visible in gallery immediately after user signup
8. Templates can be edited/customized by firms (creates firm-specific copy)
9. Documentation explains how to customize default templates
10. Sample templates reviewed by legal expert for appropriateness (if available)

**Prerequisites:** Story 3.2 (API endpoints), Story 3.6 (validation)
