# Troubleshooting Guide

## Common Issues and Solutions

This guide addresses the most frequently encountered issues in Steno and their solutions.

---

## Login and Authentication Issues

### Cannot Log In - "Invalid Credentials"

**Problem**: Error message when entering email and password

**Solutions**:
1. Double-check email address (no extra spaces)
2. Verify password (case-sensitive)
3. Try "Forgot Password" if unsure
4. Check Caps Lock is off
5. Contact firm administrator for password reset
6. Verify account is active (not deactivated)

### Account Locked After Failed Attempts

**Problem**: "Account temporarily locked" message

**Cause**: Too many failed login attempts (security feature)

**Solutions**:
- Wait 15 minutes, then try again
- Use "Forgot Password" to reset
- Contact administrator for immediate unlock
- Check you're using correct account

### Session Expired

**Problem**: "Session expired, please log in again"

**Cause**: JWT token expired (15 minutes of inactivity)

**Solutions**:
- Log in again (normal behavior)
- Enable "Remember Me" for longer sessions
- Work is auto-saved, won't lose changes
- Refresh page if issue persists

---

## AI Generation Issues

### AI Generation Fails

**Problem**: "AI generation failed" error

**Solutions**:
1. **Check Internet Connection**: Verify stable connection
2. **Retry**: Click "Generate" again
3. **Reduce Document Size**: If >50 pages of source docs, try splitting
4. **Verify API Keys**: Admin should check OpenAI/Anthropic API key
5. **Check Service Status**: AI service may be temporarily down
6. **Try Different Template**: Some templates may have issues
7. **Contact Support**: If problem persists

### Generation Takes Too Long

**Problem**: Generating for >2 minutes with no output

**Expected Time**: 30-60 seconds typical

**Solutions**:
- Check internet connection stability
- Verify large document uploads complete
- Cancel and retry generation
- Try with fewer source documents
- Check browser console for errors
- Report to support if consistent issue

### Generated Content is Poor Quality

**Problem**: AI output doesn't match expectations

**Causes & Solutions**:

**Incomplete Source Documents**:
- Upload all relevant evidence
- Include context (police reports, medical records, correspondence)
- Provide comprehensive case details

**Template Doesn't Match Case Type**:
- Verify correct template selected
- Try more specific template if available
- Review template section guidance

**Variables Not Filled**:
- Complete all required fields
- Provide specific details (not vague)
- Include dates, amounts, names

**Source Documents Poor Quality**:
- Use clear, readable scans
- OCR may fail on blurry images
- Re-upload higher quality versions

### AI Says "Context Too Long"

**Problem**: Error about document size exceeding limits

**Solutions**:
1. Reduce number of source documents
2. Upload only most relevant documents
3. Summarize very long documents
4. Split into multiple projects if needed
5. Contact support for large cases

---

## Document Upload Issues

### Upload Fails or Shows Error

**Problem**: Can't upload documents

**Solutions**:

**File Too Large**:
- Max size: 50MB per file
- Compress large PDFs
- Split multi-page scans
- Reduce image resolution

**Invalid File Type**:
- Supported: PDF, DOCX, JPG, PNG
- Convert unsupported formats
- Extract text from scanned images

**Network Issues**:
- Check internet connection
- Try smaller file first
- Wait and retry
- Use wired connection if available

**Browser Issues**:
- Clear browser cache
- Try different browser
- Disable browser extensions
- Update browser to latest version

### Document Stuck "Processing"

**Problem**: Extraction never completes

**Wait Time**: Typically 10-30 seconds per document

**If Over 2 Minutes**:
1. Refresh page
2. Check if text extracted (may show processing but be done)
3. Delete and re-upload
4. Try different file format
5. Contact support if file-specific issue

### Extracted Text is Gibberish

**Problem**: OCR produces unreadable text

**Causes**:
- Poor scan quality (blurry, skewed)
- Handwritten text (not supported)
- Non-English language
- Complex formatting

**Solutions**:
- Re-scan at higher quality
- Use native PDF (not scanned) when possible
- Manually type critical information
- Use text-based documents not images

### Can't View Uploaded Document

**Problem**: Document appears but won't display

**Solutions**:
- Click "Download" to view locally
- Presigned URL may have expired (refresh)
- Check browser allows pop-ups
- Try different browser
- Verify S3 permissions (admin)

---

## Editor and Editing Issues

### Editor Won't Load

**Problem**: Blank screen or perpetual loading

**Solutions**:
1. Refresh browser (Cmd/Ctrl + R)
2. Clear browser cache and cookies
3. Try incognito/private mode
4. Disable browser extensions
5. Try different browser
6. Check internet connection
7. Verify project exists

### Can't Edit Document

**Problem**: Editor is read-only

**Causes**:
- **View-only permissions**: Ask owner for edit access
- **Project locked**: Admin may have locked it
- **Browser issue**: Try refreshing

**Solutions**:
- Check your permissions
- Contact project owner
- Refresh page
- Try different device

### Formatting Not Working

**Problem**: Bold, italic, headings don't apply

**Solutions**:
- Select text first, then apply formatting
- Try keyboard shortcuts (Cmd/Ctrl + B for bold)
- Refresh page
- Check browser compatibility
- Clear cache and reload

### Content Disappears

**Problem**: Typed content vanishes

**Most Likely**: Another user edited same section (real-time collab)

**Solutions**:
- Check version history
- Look for other active users
- Coordinate with team on who's editing
- Create version snapshots frequently
- Use comments to claim sections

### Auto-Save Not Working

**Problem**: Changes don't save

**Solutions**:
- Check internet connection
- Look for "Saving..." indicator
- Refresh page (recent changes should appear)
- Check browser console for errors
- Verify not in "View only" mode

---

## Export Issues

### Export Button Disabled

**Problem**: Can't click Export

**Causes**:
- Document has no content (empty)
- No edit permissions
- Project locked

**Solutions**:
- Verify draft has content
- Check permissions
- Refresh page
- Contact project owner

### Export Fails

**Problem**: Error message during export

**Solutions**:

**Letterhead Issues**:
- Try exporting without letterhead
- Admin: Verify logo file is valid
- Admin: Re-upload logo (PNG/JPG, <5MB)

**Document Too Large**:
- Very long documents (>100 pages) may timeout
- Break into sections
- Export without metadata

**Network Issues**:
- Check internet connection
- Wait and retry
- Try during off-peak hours

**Browser Issues**:
- Clear browser cache
- Try different browser
- Check download folder isn't full

### Downloaded File Won't Open

**Problem**: .docx file corrupted or won't open

**Solutions**:
1. Verify file size >0 bytes
2. Re-download (may have been interrupted)
3. Try opening in different program:
   - Microsoft Word 2016+
   - Google Docs (upload and convert)
   - LibreOffice
4. Export again with different settings
5. Contact support with error details

### Letterhead Missing

**Problem**: Exported document has no letterhead

**Solutions**:
- Verify "Include Letterhead" was checked
- Admin: Check letterhead configured in settings
- Admin: Verify logo uploaded successfully
- Admin: Re-upload logo if needed
- Try exporting again

### Formatting Looks Wrong in Word

**Problem**: Export doesn't match editor

**Solutions**:
- Open in Microsoft Word (not other programs)
- Use Word 2016 or later
- Check custom fonts installed on computer
- Try different export settings
- Report specific issues to support

---

## Collaboration Issues

### Can't See Colleague's Changes

**Problem**: Real-time sync not working

**Solutions**:
1. Refresh browser
2. Check internet connection
3. Verify both users on same draft
4. Check colleague actually editing (not viewing)
5. Look for their presence indicator
6. Wait 10 seconds (may be lag)
7. Ask colleague to refresh

### Presence Indicators Not Showing

**Problem**: Can't see who's online

**Solutions**:
- Enable presence in settings (if available)
- Refresh page
- Check colleague is logged in
- Verify on same project
- Try different browser

### Comments Not Appearing

**Problem**: Added comment doesn't show

**Solutions**:
- Check Comments sidebar is open
- Refresh page
- Verify comment posted (not still draft)
- Check "Show Resolved" if it was resolved
- Try re-posting comment

### Can't Add Collaborators

**Problem**: Error when sharing project

**Solutions**:
- Verify email address correct
- Check user exists in firm
- Confirm you have owner permissions
- Try refreshing page
- Contact admin if problem persists

---

## Version History Issues

### Versions Not Saving

**Problem**: Manual snapshot doesn't create

**Solutions**:
- Check internet connection
- Verify content has changed
- Try refreshing page
- Check browser console for errors
- Contact support

### Restore Fails

**Problem**: Can't restore previous version

**Solutions**:
- Ensure no one else editing simultaneously
- Refresh page
- Check you have edit permissions
- Try restoring different version
- Contact support if consistent issue

### Version History Empty

**Problem**: No versions show in history

**Possible Causes**:
- New draft (no versions yet)
- Wrong project/draft selected
- Display/filter issue

**Solutions**:
- Verify draft has been edited
- Check you're on correct project
- Refresh page
- Clear filters
- Contact support if versions truly missing

---

## Performance Issues

### Slow Loading

**Problem**: Pages take long to load

**Solutions**:
1. **Check Internet Speed**: Run speed test
2. **Clear Browser Cache**: Free up memory
3. **Close Other Tabs**: Reduce browser load
4. **Restart Browser**: Fresh start
5. **Check System Resources**: Close unnecessary programs
6. **Try Different Browser**: Compare performance
7. **Use Wired Connection**: More stable than WiFi

### Editor Laggy

**Problem**: Typing has delay

**Solutions**:
- Close other browser tabs
- Refresh page
- Check internet connection
- Disable browser extensions
- Clear browser cache
- Try incognito mode
- Restart computer

### High Memory Usage

**Problem**: Browser using too much RAM

**Solutions**:
- Close unused tabs
- Restart browser
- Use lighter browser (Edge, Chrome)
- Close other applications
- Upgrade RAM if consistent issue
- Report to support (may be memory leak)

---

## Browser-Specific Issues

### Chrome

**Issue**: Extensions interfering

**Solution**: Disable extensions or use incognito mode

### Safari

**Issue**: WebSocket connection fails

**Solution**: Enable WebSockets in Safari settings

### Firefox

**Issue**: File downloads blocked

**Solution**: Check download settings, allow pop-ups for Steno

### Edge

**Issue**: Compatibility mode

**Solution**: Ensure Edge using modern rendering engine

---

## Mobile and Tablet Issues

### Mobile Editing Limited

**Note**: Editor optimized for desktop/tablet

**Recommendations**:
- Use tablet for editing
- Mobile for viewing only
- Desktop/laptop for full features
- Plan mobile support in future updates

### Responsive Design Issues

**Problem**: Layout broken on small screens

**Solutions**:
- Use landscape orientation (tablet)
- Increase text size if needed
- Use desktop for best experience
- Report specific UI issues

---

## Account and Permission Issues

### Can't Access Admin Panel

**Problem**: Admin menu not visible

**Solutions**:
- Verify you have admin role
- Log out and back in
- Check with another admin
- Clear browser cache
- Contact firm owner

### Missing Permissions

**Problem**: "Access denied" errors

**Solutions**:
- Contact project owner for access
- Ask admin to check your role
- Verify you're in correct firm
- Check project hasn't been deleted

### Can't Delete Project

**Problem**: Delete button disabled

**Causes**:
- Only owner can delete
- Admin locked project
- Active collaborators

**Solutions**:
- Contact project owner
- Ask admin for help
- Remove collaborators first

---

## Data and Sync Issues

### Work Not Saving

**Problem**: Changes lost after refresh

**Solutions**:
- Check "Saving..." indicator
- Verify internet connection
- Don't close browser during save
- Create manual snapshots frequently
- Check version history for lost work

### Duplicate Content

**Problem**: Content appears twice

**Possible Cause**: Sync conflict (rare)

**Solutions**:
- Refresh page
- Restore previous clean version
- Manually remove duplicates
- Report to support

---

## Email and Notification Issues

### Not Receiving Emails

**Problem**: Invitation or notification emails missing

**Solutions**:
- Check spam/junk folder
- Add noreply@steno.com to contacts
- Verify email address correct
- Check email service not blocking
- Ask admin to resend invitation

### Email Delivery Failed

**Problem**: "Email delivery failed" error

**Solutions**:
- Verify recipient email correct
- Check email service status
- Try again later
- Contact support if persistent

---

## When to Contact Support

### Contact Support If:

- Issue persists after trying solutions
- Data appears lost or corrupted
- Security concern (unauthorized access)
- Billing or account questions
- Feature request or bug report

### Don't Contact Support For:

- Password reset (use "Forgot Password" or admin)
- How-to questions (use documentation)
- Feature exists but not found (check user guides)
- Browser compatibility (try different browser first)

### How to Contact Support

**Email**: support@steno.com

**Include**:
1. **Clear Description**: What you were trying to do
2. **Steps to Reproduce**: Exact steps that cause issue
3. **Error Messages**: Copy exact text of errors
4. **Screenshots**: If visual issue
5. **Browser/OS**: Chrome v120, Windows 11, etc.
6. **Account Email**: Your login email
7. **Project ID**: If project-specific (find in URL)

**Example Good Report**:
```
Subject: Export fails with letterhead enabled

Description:
When I try to export a draft with "Include Letterhead" checked,
I get error "Export failed: Invalid image format".

Steps to reproduce:
1. Open project "Smith v. Jones" (ID: abc-123)
2. Click Export button
3. Check "Include Letterhead"
4. Click "Export to Word"
5. Error appears

Browser: Chrome 120 on macOS Sonoma 14.1
Account: attorney@firm.com
Screenshot: attached

This happens consistently. If I uncheck letterhead, export works fine.
```

---

## Error Code Reference

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check input data |
| 401 | Unauthorized | Log in again |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify resource exists |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry, contact support |
| 502 | Bad Gateway | Temporary, retry later |
| 503 | Service Unavailable | Check status page |
| 504 | Timeout | Retry, may be slow connection |

---

## Related Documentation

- [Getting Started Guide](./user-guide/getting-started.md)
- [AI Refinement Guide](./user-guide/ai-refinement.md)
- [Export Guide](./user-guide/export-delivery.md)
- [Admin Guide](./admin-guide/index.md)
- [FAQ](./faq.md)

---

## Support Resources

**Documentation**: All user guides and references

**Email Support**: support@steno.com
- Response time: Within 24 hours (business days)
- Priority support for admins

**Firm Administrator**: For account, billing, permissions

**Community** (Coming Soon): User forum for tips and tricks
