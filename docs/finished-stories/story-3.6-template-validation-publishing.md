# Story 3.6: Template Validation and Publishing

## Overview

Story 3.6 implements comprehensive validation and publishing workflow for templates, ensuring templates are structurally sound before being activated for use in demand letter generation.

## Implementation Summary

### Validation Rules Implemented

All 11 acceptance criteria from Story 3.6 have been implemented:

1. ✅ **At least one section exists** - Enforced via `createTemplateSchema.sections.min(1)`
2. ✅ **Variable names unique and follow naming rules** - Regex validation `/^[a-zA-Z0-9_]+$/` and uniqueness check
3. ✅ **AI-generated sections have prompt guidance** - Custom Zod refinement validates non-empty `promptGuidance`
4. ✅ **Static sections reference only defined variables** - Pattern matching validates all `{{variable}}` references
5. ✅ **Publish creates version record** - Transaction in API ensures atomic version creation
6. ✅ **Published template marked isActive: true** - Default value set in database schema
7. ✅ **Previous version persists** - Version history never deleted, only appended
8. ✅ **Validation errors displayed with section links** - UI shows clickable errors that scroll to problematic sections
9. ✅ **Save as Draft bypasses validation** - `updateTemplateSchema` allows partial updates
10. ✅ **Unit tests cover all validation rules** - 25 unit tests in `template.test.ts`
11. ✅ **Integration test verifies publish workflow** - 10 integration tests in `template-publish.test.ts`

## Architecture

### Backend Validation Layer

**File:** `/lib/validations/template.ts`

The validation layer uses Zod schemas with custom refinements:

```typescript
// Core section validation with AI prompt guidance check
export const templateSectionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  type: sectionTypeSchema,
  content: z.string().nullable(),
  promptGuidance: z.string().nullable(),
  required: z.boolean(),
  order: z.number().int().positive(),
}).refine((data) => {
  // AI sections must have prompt guidance
  if (data.type === 'ai_generated' && (!data.promptGuidance || data.promptGuidance.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'AI-generated sections must have prompt guidance',
  path: ['promptGuidance'],
});

// Template creation with cross-field validation
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  sections: z.array(templateSectionSchema).min(1),
  variables: z.array(templateVariableSchema).default([]),
})
  .refine(/* variable uniqueness check */)
  .refine(/* variable reference validation */);
```

### Frontend Validation Integration

**File:** `/components/templates/template-builder.tsx`

The template builder provides real-time validation feedback:

1. **Publish Action** - Runs full validation before allowing publish
2. **Save Draft Action** - Bypasses validation for incomplete templates
3. **Error Display** - Shows validation errors with "Go to section" links
4. **Scroll to Error** - Clicking error link scrolls to problematic section and highlights it

```typescript
const validateTemplate = (): {message: string; sectionId?: string}[] => {
  const errors = [];

  if (sections.length === 0) {
    errors.push({ message: 'At least one section is required' });
  }

  // Check AI sections have prompt guidance
  sections.forEach((section) => {
    if (section.type === 'ai_generated' && !section.promptGuidance?.trim()) {
      errors.push({
        message: `Section "${section.title}" must have prompt guidance`,
        sectionId: section.id,
      });
    }
  });

  // Validate variable references
  // ... (see implementation)

  return errors;
};
```

### API Version Management

**File:** `/app/api/templates/[id]/route.ts`

The PUT endpoint handles versioning automatically:

```typescript
// Update template and create version in transaction
const [updatedTemplate] = await db.transaction(async (tx) => {
  // Update template with incremented version
  const [updated] = await tx
    .update(templates)
    .set({
      name: updateData.name,
      sections: updatedSections,
      variables: updatedVariables,
      version: newVersion, // Increment version
      updatedAt: new Date(),
    })
    .where(eq(templates.id, templateId))
    .returning();

  // Create version record (AC #5)
  await tx.insert(templateVersions).values({
    templateId: templateId,
    versionNumber: newVersion,
    structure: {
      sections: updatedSections,
      variables: updatedVariables,
    },
    createdBy: user.userId,
  });

  return [updated];
});
```

## Database Schema

### Template Versioning

The `template_versions` table stores complete snapshots of template structure:

```sql
CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  structure JSONB NOT NULL, -- Complete sections + variables snapshot
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX template_versions_template_id_idx ON template_versions(template_id);
```

**Key Design Decisions:**
- Version records are never deleted (AC #7)
- Structure stored as JSONB for flexibility
- Foreign key cascade ensures cleanup when template deleted
- Index on `template_id` for fast version history queries

## Validation Error UX

### Error Display Format

Validation errors are displayed in an alert with:
- **Clear error messages** describing what needs to be fixed
- **Section identification** showing which section has the problem
- **Clickable links** to scroll directly to the problematic section
- **Visual highlighting** of the section (red ring for 2 seconds)

Example error message:
```
Please fix the following errors before publishing:
• Section "Case Facts" (AI Generated) must have prompt guidance [Go to section]
• Section "Introduction" references undefined variable: {{undefined_var}} [Go to section]
```

### Scroll Behavior

When user clicks "Go to section":
1. Page scrolls to section with smooth animation
2. Section element highlighted with red ring
3. Highlight removed after 2 seconds
4. User can immediately edit the section

Implementation:
```typescript
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(`section-${sectionId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('ring-2', 'ring-red-500');
    setTimeout(() => {
      element.classList.remove('ring-2', 'ring-red-500');
    }, 2000);
  }
};
```

## Testing Strategy

### Unit Tests (25 tests)

**File:** `/lib/validations/__tests__/template.test.ts`

Covers all validation rules:
- Section validation (static, AI-generated, variable types)
- Variable name rules (alphanumeric + underscores)
- Variable uniqueness
- AI sections require prompt guidance
- Variable reference validation
- Section order validation
- Template name requirements
- Complex multi-section/variable templates

### Integration Tests (10 tests)

**File:** `/app/api/templates/__tests__/template-publish.test.ts`

Covers publish workflow:
- Initial version creation on publish
- New version creation on update
- Previous version persistence
- isActive flag behavior
- Sequential version numbering
- Version history integrity
- Validation enforcement scenarios

### Test Results

All tests passing:
```
✓ lib/validations/__tests__/template.test.ts (25 tests) 4ms
✓ app/api/templates/__tests__/template-publish.test.ts (10 tests) 110ms
✓ app/api/templates/__tests__/templates-crud.test.ts (11 tests) 120ms
```

## Usage Examples

### Creating and Publishing a Template

```typescript
// 1. Create draft template (bypasses validation)
const draft = await apiClient.post('/api/templates', {
  name: 'Personal Injury Template',
  description: 'For PI cases',
  sections: [
    {
      id: uuidv4(),
      title: 'Introduction',
      type: 'static',
      content: 'Dear {{defendant_name}},',
      promptGuidance: null,
      required: true,
      order: 1,
    },
    // Incomplete - missing AI prompt guidance for AI section
    {
      id: uuidv4(),
      title: 'Facts',
      type: 'ai_generated',
      content: null,
      promptGuidance: '', // Empty - will fail validation
      required: true,
      order: 2,
    },
  ],
  variables: [
    {
      name: 'defendant_name',
      type: 'text',
      required: true,
      defaultValue: null,
    },
  ],
});

// 2. Save as draft - saves successfully despite incomplete AI section
handleSaveDraft(data); // No validation errors

// 3. Try to publish - validation fails
handlePublish(data);
// Shows error: "Section 'Facts' (AI Generated) must have prompt guidance"

// 4. Fix the issue
sections[1].promptGuidance = 'Summarize the key facts of the case';

// 5. Publish successfully
handlePublish(data); // Creates version 1, sets isActive: true
```

### Variable Reference Validation

```typescript
// This will FAIL validation
const template = {
  name: 'Test',
  sections: [
    {
      type: 'static',
      content: 'Hello {{undefined_variable}}', // References undefined variable
    },
  ],
  variables: [
    { name: 'defined_variable', type: 'text' },
  ],
};

// Error: "Section references undefined variable: {{undefined_variable}}"

// This will PASS validation
const fixedTemplate = {
  name: 'Test',
  sections: [
    {
      type: 'static',
      content: 'Hello {{defined_variable}}', // References defined variable
    },
  ],
  variables: [
    { name: 'defined_variable', type: 'text' },
  ],
};
```

## API Endpoints

### POST /api/templates (Create)
- Validates full template structure
- Creates initial version (v1)
- Sets `isActive: true`
- Returns 201 on success

### PUT /api/templates/:id (Update/Publish)
- Validates full template structure
- Increments version number
- Creates new version record
- Preserves all previous versions
- Returns 200 on success

### GET /api/templates/:id/versions (Version History)
- Returns all versions for a template
- Ordered by version number
- Includes structure snapshot and metadata

## Security Considerations

1. **Firm Isolation** - All validation happens within firm context
2. **RBAC** - Only admins and attorneys can publish templates
3. **Version Integrity** - Versions are immutable once created
4. **Input Validation** - All user input sanitized via Zod schemas

## Performance Notes

- Validation runs client-side before API call (faster feedback)
- Server-side validation prevents invalid data from reaching DB
- Version creation uses transaction for atomicity
- Indexes on `template_id` ensure fast version queries

## Future Enhancements

1. **Variable Type Enforcement** - Validate variable values match declared types
2. **Section Dependencies** - Define dependencies between sections
3. **Template Preview** - Live preview with sample variable values
4. **Validation Warnings** - Non-blocking warnings for best practices
5. **Bulk Template Import** - Import multiple templates with validation

## Related Stories

- **Story 3.2** - Template CRUD API (provides base for validation)
- **Story 3.4** - Template Builder UI (integrates validation display)
- **Story 3.5** - Variable Definition (used in reference validation)
- **Story 3.7** - Template Preview (will use validated structure)
- **Story 3.8** - Version History UI (displays created versions)

## Acceptance Criteria Status

| AC | Description | Status | Implementation |
|----|-------------|--------|----------------|
| 1 | Validation checks (sections, fields, types) | ✅ | `createTemplateSchema` |
| 2 | Variable names unique and follow rules | ✅ | Regex + uniqueness refinement |
| 3 | AI sections have prompt guidance | ✅ | Custom Zod refinement |
| 4 | Variables reference only defined vars | ✅ | Pattern matching validation |
| 5 | Publish creates version record | ✅ | Transaction in PUT endpoint |
| 6 | Published template isActive: true | ✅ | Database default + API |
| 7 | Previous versions persist | ✅ | Append-only version history |
| 8 | Errors displayed with section links | ✅ | UI error display + scroll |
| 9 | Save as Draft bypasses validation | ✅ | `updateTemplateSchema` |
| 10 | Unit tests cover validation | ✅ | 25 tests in `template.test.ts` |
| 11 | Integration test for publish | ✅ | 10 tests in `template-publish.test.ts` |

## Conclusion

Story 3.6 successfully implements a robust validation and publishing system that:
- Ensures template quality through comprehensive validation
- Provides excellent UX with clear error messages and navigation
- Maintains complete version history for audit and rollback
- Passes all tests with 100% coverage of acceptance criteria
- Sets foundation for future template features (preview, import, etc.)
