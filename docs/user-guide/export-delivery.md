# Export & Delivery Guide

## Overview

Steno allows you to export your demand letters as professional Word documents (.docx) with your firm's letterhead, proper legal formatting, and version tracking. This guide covers everything you need to know about exporting and delivering your documents.

---

## Exporting to Word (DOCX)

### Basic Export

1. Open your demand letter in the editor
2. Click the **Export** button in the top toolbar
3. Configure export options (see below)
4. Click **Export to Word**
5. Your browser will download the .docx file

### Export Options

#### Include Metadata

**What It Does:**
- Adds version number to footer
- Includes generation timestamp
- Shows export date

**When to Enable:**
- Internal drafts for review
- Version tracking needed
- Audit trail required

**When to Disable:**
- Final version for client or opposing counsel
- Clean, professional appearance desired

#### Include Letterhead

**What It Does:**
- Adds firm logo at top
- Includes firm name and contact information
- Applies custom header formatting

**When to Enable:**
- External communications
- Official demands to insurance companies
- Professional presentation required

**When to Disable:**
- Internal drafts
- When letterhead will be added later
- Testing or review copies

---

## Understanding Letterhead

### What's Included

Your firm's letterhead can include:

1. **Logo**: Firm logo image (PNG, JPG, or SVG)
2. **Firm Name**: Bold, centered company name
3. **Contact Information**: Address, phone, email, website
4. **Custom Formatting**: Colors, fonts, and spacing

### Letterhead Configuration

Letterhead is configured by your firm administrator in the Admin Panel > Settings.

**If your letterhead doesn't appear:**
- Check with your admin that letterhead is configured
- Verify logo file is uploaded and valid
- Ensure "Include Letterhead" option is checked during export

### Sample Letterhead Layout

```
                    [FIRM LOGO]

              SMITH & ASSOCIATES LAW FIRM

     123 Main Street, Suite 400, Los Angeles, CA 90012
     Tel: (555) 123-4567 | Email: info@smithlaw.com | www.smithlaw.com


                    DEMAND LETTER

Re: John Doe
Case: Personal Injury - Car Accident

[Letter content begins here...]
```

---

## Document Formatting

### Automatic Formatting

Steno automatically applies professional legal formatting:

**Margins:**
- Top: 1 inch
- Bottom: 1 inch
- Left: 1 inch
- Right: 1 inch
- (Customizable by admin)

**Font:**
- Default: Times New Roman, 12pt
- (Customizable by admin)

**Line Spacing:**
- 1.5 line spacing for body text
- Double spacing after paragraphs

**Page Numbers:**
- Footer: "Page X of Y" format
- Centered at bottom

**Headers:**
- Heading 1: Bold, 16pt
- Heading 2: Bold, 14pt
- Heading 3: Bold, 12pt

### Preserved Formatting

The following formatting from the editor is preserved in export:

- **Bold text**
- *Italic text*
- Underlined text
- Headings (H1, H2, H3)
- Bulleted lists
- Numbered lists
- Paragraph spacing
- Indentation

---

## File Naming Convention

Exported files are automatically named:

```
[ProjectTitle]_v[Version]_[Date].docx
```

**Example:**
```
Smith_Car_Accident_v3_2024-11-11.docx
```

**Components:**
- **Project Title**: Sanitized (spaces and special characters removed)
- **Version Number**: Current draft version (v1, v2, v3, etc.)
- **Date**: Export date in YYYY-MM-DD format

### Manual Renaming

You can rename the file after download, but keeping the convention helps with:
- Version tracking
- File organization
- Identifying drafts quickly

---

## Export History

Every export is tracked in the system.

### Viewing Export History

1. Open your project in the editor
2. Click the **History** tab in the right sidebar
3. Select **Export History**
4. View list of all exports with:
   - Version number
   - Export date and time
   - Who exported it
   - File size
   - Download link

### Re-Downloading Previous Exports

1. Go to Export History
2. Find the export you want
3. Click **Download**
4. File will download again (same as original)

**Note**: Exports are stored in S3 with 7-year retention for compliance.

---

## Working with Exported Documents

### Opening in Microsoft Word

1. Download the .docx file
2. Open in Microsoft Word (2016 or later recommended)
3. Review formatting and content
4. Make final edits if needed
5. Save or print as needed

**Compatibility:**
- Microsoft Word 2016+: Full support
- Microsoft Word 2013: Supported
- Word for Mac: Fully compatible
- Google Docs: Upload and convert (some formatting may change)
- LibreOffice: Generally compatible (test formatting)

### Final Review Checklist

Before sending to client or opposing counsel:

- [ ] Verify all facts and figures are accurate
- [ ] Check names, dates, and amounts
- [ ] Review for typos and grammar
- [ ] Confirm letterhead appears correctly
- [ ] Verify page numbers are correct
- [ ] Remove any draft comments or highlights
- [ ] Check that all sections are complete
- [ ] Verify signature block is present

### Editing in Word

**Recommended Edits in Word:**
- Minor typo corrections
- Final formatting adjustments
- Adding signature
- Date corrections

**NOT Recommended in Word:**
- Major content changes (do in Steno, then re-export)
- Structural reorganization (do in Steno)
- Adding new sections (do in Steno)

**Why?** Changes made in Word aren't reflected in Steno's version history. For significant changes, edit in Steno and export again.

---

## Email Delivery (Coming Soon)

Future versions of Steno will include direct email delivery:

- Send directly from Steno to recipients
- Track email opens and downloads
- Automatic delivery confirmations
- Email templates for cover messages
- Certified delivery options

**Current Workaround:**
1. Export to Word as described above
2. Attach to email in your email client
3. Send to recipients
4. Note delivery in Steno project notes/comments

---

## Print to PDF

To create a PDF version:

### Method 1: Export from Word

1. Export to Word from Steno
2. Open in Microsoft Word
3. File > Save As
4. Select "PDF" as file type
5. Click Save

### Method 2: Print to PDF

1. Export to Word from Steno
2. Open in Microsoft Word
3. File > Print
4. Select "Print to PDF" as printer
5. Save PDF file

### Method 3: Use Browser (Future Feature)

Direct PDF export from Steno is planned for future release.

---

## Export Settings (Admin-Configured)

Your firm administrator can customize export settings:

### Custom Margins

- Adjust margins for different court requirements
- Standard: 1 inch all sides
- Narrow: 0.5 inch (more content per page)
- Wide: 1.5 inch (traditional brief format)

### Custom Fonts

- Font Family: Times New Roman, Arial, Calibri, Georgia
- Font Size: 10pt - 14pt
- Line Spacing: Single, 1.5, Double

### Letterhead Customization

- Logo position: Left, Center, Right
- Logo size: Small, Medium, Large
- Contact info layout: Single line, Multi-line, Columned
- Header height adjustments

**Note**: These settings apply to all exports for your firm. Contact your administrator to request changes.

---

## Version Tracking

### Understanding Versions

Each time you make significant changes, Steno can create a version snapshot:

- **v1**: Initial AI-generated draft
- **v2**: After first round of edits
- **v3**: After refinements and colleague review
- **v4**: Final version before sending

### Creating Versions Before Export

**Best Practice:**

1. Complete your edits
2. Create a version snapshot: **Save as Version**
3. Add version note: "Final draft for review"
4. Export the document
5. Version number appears in filename and footer

This ensures:
- Clear version history
- Ability to track changes
- Easy rollback if needed
- Audit trail for compliance

---

## Troubleshooting Export Issues

### Export Button Disabled

**Problem**: Can't click Export button

**Solutions:**
- Ensure document has content (not empty)
- Check you have edit permissions
- Verify project is not locked
- Refresh the page

### Export Fails or Shows Error

**Problem**: Export starts but fails with error message

**Solutions:**
- Check internet connection
- Verify letterhead logo is valid (if enabled)
- Try exporting without letterhead
- Try exporting without metadata
- Reduce document size if very large (>50 pages)
- Contact support with error message

### Downloaded File Won't Open

**Problem**: .docx file won't open in Word

**Solutions:**
- Ensure Microsoft Word is installed (2013 or later)
- Check file isn't corrupted (file size >0 bytes)
- Try opening in Google Docs
- Download again (may have been interrupted)
- Contact support if problem persists

### Letterhead Doesn't Appear

**Problem**: Exported document missing letterhead

**Solutions:**
- Verify "Include Letterhead" was checked
- Confirm administrator has configured letterhead
- Check that logo file is valid (PNG/JPG, <5MB)
- Try exporting again
- Contact administrator to verify settings

### Formatting Looks Wrong

**Problem**: Exported document formatting differs from editor

**Solutions:**
- Open in Microsoft Word (not other programs)
- Check Word version (2016+ recommended)
- Verify custom fonts are installed on your computer
- Try exporting with default settings
- Report specific formatting issues to support

### File Size Too Large

**Problem**: Exported file is very large (>10MB)

**Causes:**
- High-resolution logo in letterhead
- Very long document (100+ pages)
- Embedded images

**Solutions:**
- Ask admin to optimize letterhead logo
- Break very long documents into sections
- Compress images before inserting
- Use PDF instead (smaller file size)

---

## Best Practices

### For Attorneys

1. **Always Review in Word**: Never send without opening and reviewing
2. **Version Control**: Use version numbers consistently
3. **Save Master Copies**: Keep a copy of sent versions
4. **Metadata for Internal**: Include metadata for internal drafts
5. **Clean for External**: Remove metadata for final versions

### For Paralegals

1. **Consistent Naming**: Follow filename conventions
2. **Organize Downloads**: Create folder structure for exports
3. **Track Deliveries**: Note when and to whom documents were sent
4. **Archive Properly**: Save final versions in document management system
5. **Quality Check**: Always preview before passing to attorney

### For Legal Assistants

1. **Verify Letterhead**: Always check letterhead appears correctly
2. **Test Prints**: Print test copy before sending originals
3. **Check Dates**: Ensure current date is in letter
4. **Signature Blocks**: Verify attorney names and titles
5. **Document Tracking**: Update case management system

---

## Export Checklist

Use this checklist before every export:

### Pre-Export

- [ ] All edits complete
- [ ] Spell check run
- [ ] Facts verified against source documents
- [ ] Version snapshot created (if significant changes)
- [ ] Comments resolved
- [ ] Colleague review complete (if applicable)

### Export Configuration

- [ ] Include Letterhead: Yes/No (appropriate choice)
- [ ] Include Metadata: Yes/No (appropriate choice)
- [ ] Export options reviewed

### Post-Export

- [ ] File downloaded successfully
- [ ] Opened in Microsoft Word
- [ ] Letterhead appears correctly
- [ ] Formatting looks professional
- [ ] Page numbers correct
- [ ] All content present
- [ ] Ready for final review/delivery

---

## Advanced Tips

### Batch Exporting

To export multiple drafts:

1. Open first project
2. Export with consistent settings
3. Note settings used
4. Repeat for remaining projects
5. All exports will have consistent formatting

### Template-Specific Exports

Different case types may need different export settings:

**Insurance Demands:**
- Include Letterhead: Yes
- Include Metadata: No
- Professional, clean appearance

**Internal Reviews:**
- Include Letterhead: No
- Include Metadata: Yes
- Focus on version tracking

**Court Filings:**
- Include Letterhead: Per local rules
- Include Metadata: No
- Check court-specific formatting requirements

### Creating Export Presets (Future Feature)

Planned enhancement will allow saving export configurations:
- "Insurance Demand" preset
- "Internal Review" preset
- "Court Filing" preset

---

## Integration with Document Management

### Recommended Workflow

1. **Generate in Steno**: Create and refine demand letter
2. **Export to Word**: Download .docx file
3. **Final Review**: Open in Word, make minor edits
4. **Save to DMS**: Upload to your document management system
5. **Track in Steno**: Use comments to note delivery status

### File Organization

Suggested folder structure:

```
Client_Name/
├── Case_Correspondence/
│   ├── Demand_Letters/
│   │   ├── Draft_v1_2024-11-01.docx
│   │   ├── Draft_v2_2024-11-05.docx
│   │   └── Final_v3_2024-11-11.docx
```

---

## Compliance and Retention

### Export Records

All exports are logged for compliance:
- Who exported the document
- When it was exported
- Which version was exported
- File metadata

### Retention Policy

- Exports stored in AWS S3 with encryption
- 7-year retention minimum (legal requirement)
- Automatic archival to S3 Glacier for cost efficiency
- Accessible by administrators for audit purposes

---

## Related Documentation

- [Getting Started Guide](./getting-started.md) - Basic Steno usage
- [AI Refinement Guide](./ai-refinement.md) - Improve content before export
- [Collaboration Guide](./collaboration.md) - Work with team before finalizing
- [Admin Guide](../admin-guide/index.md) - Configure letterhead and export settings

---

## Support

Need help with exports?

- **Email**: support@steno.com
- **Admin**: Contact your firm administrator
- **Documentation**: See [Troubleshooting Guide](../troubleshooting.md)
