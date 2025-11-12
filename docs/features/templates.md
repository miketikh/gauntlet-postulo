# Templates Guide

## Overview

Templates define the structure and content guidance for AI-generated demand letters. They include sections, variables, and prompts that guide the AI in creating professional, consistent documents.

---

## Understanding Templates

### What is a Template?

A template consists of:
- **Sections**: Organized parts of the demand letter (intro, liability, damages, closing)
- **Variables**: Case-specific data fields (plaintiff name, dates, amounts)
- **Prompt Guidance**: Instructions for AI on what to include in each section
- **Formatting Rules**: Structure and style guidelines

### Default Templates

Steno includes pre-built templates:
- **Personal Injury Demand Letter**: For accident and injury cases
- **Contract Breach Demand**: For contract dispute cases
- **Property Damage Demand**: For property-related claims
- **Employment Dispute Demand**: For workplace issues

---

## Using Templates

### Selecting a Template

When creating a project:
1. Click **New Project**
2. Fill in basic details
3. Click **Select Template**
4. Browse template gallery
5. Preview template sections
6. Click **Use This Template**

### Template Information

Each template shows:
- Name and description
- Case types it's suited for
- Sections included
- Required variables
- Sample output

---

## Creating Custom Templates

**Note**: Template creation requires appropriate permissions (typically admin or attorney role).

### Step 1: Access Template Builder

1. Navigate to **Dashboard > Templates**
2. Click **Create New Template**
3. Enter basic information:
   - **Name**: Clear, descriptive name
   - **Description**: When to use this template
   - **Case Type**: Category for filtering

### Step 2: Define Sections

Add sections in order they should appear:

**Section Fields:**
- **Title**: Section heading (e.g., "Liability Analysis")
- **Order**: Position in document (1, 2, 3...)
- **Prompt Guidance**: Instructions for AI
- **Required**: Whether section must be included

**Example Section:**
```
Title: Damages Summary
Order: 4
Prompt Guidance: Summarize all damages claimed, including medical expenses, lost wages, pain and suffering, and property damage. List specific amounts where available and cite source documents.
Required: Yes
```

### Step 3: Define Variables

Variables are placeholders for case-specific information:

**Variable Types:**
- **Text**: Names, addresses, descriptions
- **Date**: Incident dates, deadlines
- **Number**: Amounts, quantities
- **Choice**: Dropdown selections

**Example Variables:**
```
Name: plaintiff_name
Label: Plaintiff Name
Type: Text
Required: Yes

Name: incident_date
Label: Date of Incident
Type: Date
Required: Yes

Name: demand_amount
Label: Settlement Demand
Type: Number
Required: Yes
Format: Currency
```

### Step 4: Preview and Test

1. Click **Preview Template**
2. Fill in sample variables
3. Generate test draft
4. Review AI output
5. Refine section prompts if needed
6. Test with actual case documents

### Step 5: Publish Template

1. Review all sections and variables
2. Click **Publish Template**
3. Template becomes available to all firm users
4. Can be set as default (admins only)

---

## Template Best Practices

### Writing Effective Prompt Guidance

**Be Specific:**
- Bad: "Write about damages"
- Good: "List each category of damages (medical, lost wages, pain and suffering) with specific amounts from source documents. Include totals for each category and grand total."

**Provide Structure:**
```
Prompt: Write liability analysis in three parts:
1. Defendant's duty of care
2. How defendant breached that duty
3. How breach caused plaintiff's injuries
Cite specific facts from source documents.
```

**Reference Source Material:**
```
Prompt: Based on medical records, describe:
- Initial diagnosis and treatment
- Ongoing treatment and therapy
- Current prognosis
- Future medical needs
Include provider names and treatment dates.
```

### Organizing Sections

**Logical Flow:**
1. Introduction (parties, incident overview)
2. Facts (detailed incident description)
3. Liability (legal analysis of fault)
4. Damages (medical, economic, non-economic)
5. Settlement Demand (specific amount and deadline)
6. Conclusion (summary and next steps)

**Section Length:**
- Keep sections focused on one topic
- Too many small sections = fragmented
- Too few large sections = overwhelming AI
- Aim for 5-8 main sections

### Variable Naming

**Conventions:**
- Use lowercase with underscores: `plaintiff_name`
- Be descriptive: `incident_date` not `date1`
- Group related variables: `medical_provider_1`, `medical_provider_2`
- Avoid special characters

---

## Managing Templates

### Editing Templates

**Versioning:**
- Editing a published template creates a new version
- Old versions preserved for existing projects
- New projects use latest version

**To Edit:**
1. Go to **Templates**
2. Find template
3. Click **Edit**
4. Make changes
5. Click **Update Template**
6. Version increments automatically

### Template Versions

View version history:
1. Open template
2. Click **Versions** tab
3. See all previous versions
4. Compare changes between versions
5. Revert if needed (admin only)

### Deactivating Templates

To hide a template without deleting:
1. Edit template
2. Uncheck **Active**
3. Save changes
4. Template hidden from user selection
5. Existing projects unaffected

### Deleting Templates

**Caution**: Cannot delete templates used by existing projects.

1. Ensure no active projects use template
2. Edit template
3. Click **Delete Template**
4. Confirm action
5. Template permanently removed

---

## Template Variables Reference

### Standard Variables

Most templates should include:

**Parties:**
- `plaintiff_name`: Your client's name
- `defendant_name`: Opposing party
- `plaintiff_attorney`: Your name/firm
- `defendant_attorney`: Opposing counsel (if known)

**Case Details:**
- `incident_date`: When incident occurred
- `case_number`: Court case number (if filed)
- `jurisdiction`: State/county
- `case_type`: Personal injury, contract, etc.

**Demands:**
- `demand_amount`: Settlement amount requested
- `response_deadline`: Deadline for response
- `payment_terms`: How payment should be made

### Variable Formatting

**Currency:**
```
Type: Number
Format: Currency
Displays: $50,000.00
```

**Dates:**
```
Type: Date
Format: Long (November 15, 2024)
Format: Short (11/15/2024)
Format: ISO (2024-11-15)
```

**Percentages:**
```
Type: Number
Format: Percentage
Displays: 25%
```

---

## Advanced Features

### Conditional Sections

Show/hide sections based on case type:

```
Section: Punitive Damages
Condition: case_type == "gross_negligence"
```

**Note**: Conditional sections planned for future release.

### Section Templates

Reuse common sections across templates:

```
"Closing Section" appears in all demand letters
Define once, include in multiple templates
```

**Note**: Section libraries planned for future release.

### Firm-Wide Defaults

Admins can set:
- Default template for new projects
- Preferred templates by case type
- Required templates by practice area

---

## Troubleshooting

### AI Not Following Template

**Problem**: Generated draft doesn't match template structure

**Solutions:**
- Make prompt guidance more explicit
- Add examples to section guidance
- Ensure source documents contain relevant information
- Break complex sections into smaller ones
- Review and refine prompts

### Variables Not Populating

**Problem**: Template variables blank in output

**Solutions:**
- Ensure variables are marked as required
- Check variable names don't have typos
- Verify values provided when creating project
- Check variable type matches input format

### Template Won't Save

**Problem**: Can't save template changes

**Solutions:**
- Check all required fields completed
- Ensure section order numbers unique
- Verify variable names don't duplicate
- Check for validation errors
- Contact admin if permissions issue

---

## Related Documentation

- [Getting Started Guide](../user-guide/getting-started.md)
- [AI Refinement](../user-guide/ai-refinement.md)
- [Admin Guide](../admin-guide/index.md)
