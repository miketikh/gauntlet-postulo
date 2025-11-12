# Frequently Asked Questions (FAQ)

## General Questions

### What is Steno?

Steno is an AI-powered demand letter generator designed for law firms. It streamlines the process of creating professional demand letters by combining your case documents with AI assistance and customizable templates.

### How much does Steno cost?

Pricing varies by firm size and usage. Contact your firm administrator for specific pricing information. Generally, pricing is based on:
- Number of users
- AI usage (token consumption)
- Storage requirements
- Support tier

### Is my data secure?

Yes. Steno implements enterprise-grade security:
- **Encryption**: All data encrypted at rest (S3 SSE-S3) and in transit (TLS 1.3)
- **Firm Isolation**: Multi-tenant architecture ensures you only access your firm's data
- **Access Control**: Role-based permissions (admin, attorney, paralegal)
- **Audit Logging**: All actions logged for 7+ years for compliance
- **AWS Infrastructure**: Hosted on secure AWS services

### Can I use Steno on mobile devices?

**Current Support**:
- **Desktop/Laptop**: Full functionality (recommended)
- **Tablet**: Good support for viewing and editing
- **Phone**: Viewing supported, editing limited

**Best Practice**: Use desktop for creating and editing, mobile for reviewing.

### What AI models does Steno use?

Currently: **GPT-4.1-mini** from OpenAI (via Vercel AI SDK)

**Why GPT-4.1-mini?**
- Fast generation speed
- High quality output
- Cost-effective
- Excellent legal reasoning

**Future Options**: Claude 3.7 Sonnet support planned.

### How accurate is the AI?

AI generates high-quality drafts but requires human review:
- **Strengths**: Structure, language, legal reasoning
- **Requires Verification**: Facts, dates, amounts, specific citations
- **Best Practice**: Always review and verify AI output against source documents

**Bottom Line**: AI is a powerful assistant, not a replacement for attorney judgment.

### What browsers are supported?

**Fully Supported**:
- Chrome 100+ (recommended)
- Firefox 100+
- Safari 16+
- Microsoft Edge 100+

**Not Supported**:
- Internet Explorer (discontinued)
- Very old browser versions

**Best Experience**: Latest version of Chrome or Edge.

---

## Account and Access

### How do I get an account?

Accounts are created by your firm administrator. Contact your admin to request access. They will:
1. Create your account
2. Assign appropriate role
3. Send login credentials
4. You'll change password on first login

### I forgot my password. What do I do?

1. Click "Forgot Password" on login page
2. Enter your email
3. Check email for reset link (including spam/junk)
4. Follow link to set new password

**Alternative**: Contact your firm administrator for manual password reset.

### Can I change my email address?

Yes. Contact your firm administrator to update your email. Email change triggers verification process for security.

### What's the difference between Admin, Attorney, and Paralegal roles?

**Admin**:
- All attorney/paralegal permissions
- User management
- Firm settings configuration
- Analytics and audit logs
- Template management

**Attorney**:
- Create and edit projects
- AI generation and refinement
- Export documents
- Manage templates (if configured)
- Full collaboration features

**Paralegal**:
- Create and edit projects
- Upload documents
- AI generation
- Export documents
- Collaborate with team
- Cannot manage templates (default)

---

## Projects and Documents

### How many projects can I create?

No limit on number of projects per user or firm (within reason).

### Can I delete a project?

Yes, if you're the project owner. Click the three-dot menu on project card > Delete. **Warning**: Deletion cannot be undone.

### What file types can I upload?

**Supported Formats**:
- **PDFs**: Police reports, medical records, correspondence
- **Word Documents**: .docx files
- **Images**: .jpg, .png (OCR extracts text)

**Maximum Size**: 50MB per file

**Not Supported**: Excel spreadsheets, PowerPoint, video, audio

### How many documents can I upload per project?

No strict limit, but practical considerations:
- More documents = longer AI processing time
- Recommend 10-20 key documents
- Focus on quality over quantity
- Upload only relevant evidence

### Can I delete uploaded documents?

Yes. Click on document in sidebar > Delete. **Note**: Deletion doesn't affect already-generated drafts.

### How long does document processing take?

**Typical Times**:
- Small PDF (1-5 pages): 5-10 seconds
- Medium PDF (10-50 pages): 20-45 seconds
- Large PDF (50+ pages): 1-2 minutes
- Images (OCR): 10-30 seconds per image

**If taking longer**: Check document quality and file size.

---

## AI Generation and Refinement

### How long does AI generation take?

**Typical**: 30-60 seconds for complete demand letter

**Factors**:
- Document complexity
- Source document length
- Template size
- Network speed

**If over 2 minutes**: Something may be wrong. Refresh and retry.

### Can I cancel AI generation mid-stream?

Currently no. Generation completes fully then you can discard and regenerate if unhappy with output.

### How much does AI generation cost?

AI usage is included in your firm's subscription. Pricing based on token consumption:
- Average demand letter: $0.20-0.50
- Refinement: $0.05-0.15
- Costs tracked in admin analytics

### Can I generate multiple drafts for the same project?

Yes! Generate as many times as you want. Each generation creates a new version. Previous versions saved in history.

### Will AI include fake citations or facts?

AI generates based on your source documents. However:
- **Always verify facts** against source documents
- **Check all citations** if AI includes them
- **Confirm dates and amounts** are accurate
- AI may occasionally "hallucinate" - human review catches this

**Best Practice**: Treat AI output as first draft requiring verification.

### Can AI write in different tones?

Yes! Use refinement Quick Actions:
- **Make More Assertive**: Strong, firm tone
- **Soften Tone**: Conciliatory, diplomatic tone
- **Improve Clarity**: Clear, accessible language

Or write custom instructions specifying desired tone.

### Does AI learn from my feedback?

Currently no. Each generation is independent. Future versions may include learning from firm-specific feedback.

---

## Templates

### Can I create custom templates?

Yes, if you have appropriate permissions (typically admin or attorney). Navigate to Templates > Create New Template.

### Can I modify existing templates?

You can create copies and modify those. Modifying system default templates requires admin permissions to prevent accidental changes.

### Will my custom template affect other users?

If you publish the template, yes - all firm members can use it. Keep as draft if personal use only.

### Can I share templates with other firms?

Not currently. Templates are firm-specific. Cross-firm template sharing planned for future release.

---

## Collaboration

### How many people can edit simultaneously?

No technical limit. Practical limit ~5-10 concurrent editors for smooth experience. More users = more potential for conflict.

### Can I see who's viewing my document?

Yes! Presence indicators show all active users viewing or editing. Hover over avatars in top-right for details.

### What happens if two people edit the same text?

Steno uses CRDT technology (Yjs) to automatically merge changes:
- Character-level synchronization
- Last edit wins for same character
- No manual conflict resolution needed
- Works surprisingly well even with conflicts

### Can I work offline?

**Limited Support**:
- Recent content cached for viewing
- Cannot edit while offline
- Changes sync when reconnected
- Best Practice: Maintain internet connection

### How do I @mention someone in comments?

@mention feature coming soon. Currently, add comment and notify colleague separately (email, Slack, etc.).

---

## Export and Delivery

### Can I export to PDF?

Not directly yet. Current workaround:
1. Export to Word (.docx)
2. Open in Microsoft Word
3. Save As > PDF

Direct PDF export planned for future release.

### Can I send documents directly from Steno?

Email delivery planned for future release. Currently:
1. Export to Word
2. Attach to email in your email client
3. Send to recipients

### How do I add my firm's letterhead?

Firm administrators configure letterhead in Admin > Settings > Letterhead. Upload logo and enter firm details.

### Why doesn't my letterhead appear?

**Check**:
- Letterhead configured by admin
- "Include Letterhead" checked during export
- Logo file is valid (PNG/JPG, <5MB)
- Try re-uploading logo

### Can I customize export formatting?

Admins can configure:
- Margins
- Font family and size
- Line spacing
- Page number format

Users use these firm-wide settings. Per-user customization not available.

### How long are exported files stored?

Exports stored in S3 with 7-year retention for compliance. Accessible anytime via Export History.

---

## Version History

### How long is version history kept?

Indefinitely. All versions retained for audit trail and compliance.

### Can I delete old versions?

No. Version history is immutable for compliance purposes. All versions preserved.

### What's the difference between automatic and manual snapshots?

**Automatic**:
- System creates after major milestones
- Every 50+ changes
- Before restoring previous version

**Manual**:
- You create at strategic points
- Add description for context
- Recommended for tracking iterations

### Can I export an old version?

Yes! Select version from history > Export This Version. Useful for showing progression to clients.

---

## Billing and Limits

### Is there a limit on AI usage?

Depends on your firm's plan. Admins can set optional limits:
- Generations per user per month
- Total tokens per month
- Cost alerts

Check with admin for your firm's limits.

### What counts as AI usage?

- Initial draft generation
- Refinements (Quick Actions or custom)
- Large refinements use more tokens
- Token tracking in admin analytics

### How do I check my usage?

Admins see firm-wide usage in Analytics. Individual users currently don't see personal usage dashboard.

### Can my firm upgrade/downgrade?

Yes. Contact your account manager or admin to modify subscription.

---

## Performance and Technical

### Why is Steno slow?

**Common Causes**:
- Slow internet connection
- Too many browser tabs open
- Large documents processing
- Peak usage times
- Browser needs restart

See [Troubleshooting Guide](./troubleshooting.md) for solutions.

### What ports does Steno use?

- **HTTPS**: Port 443 (standard)
- **WebSocket**: Same port 443 (wss://)

Most firewalls allow these by default.

### Does Steno work behind corporate firewalls?

Usually yes. If issues:
- Ensure ports 443 allowed
- WebSocket connections allowed
- Contact IT to whitelist Steno domain

### Can I use VPN with Steno?

Yes, but:
- May be slower
- More likely to have connection issues
- Disable VPN if problems occur

---

## Data and Compliance

### Where is my data stored?

**AWS US East (Virginia)**:
- PostgreSQL database (Lightsail)
- Document storage (S3)
- Encrypted at rest and in transit

### Is Steno HIPAA compliant?

Steno implements appropriate security measures. However:
- HIPAA compliance requires Business Associate Agreement (BAA)
- Contact sales for BAA and HIPAA-specific deployment
- Standard deployment not HIPAA certified

### Can I export all my firm's data?

Admins can export:
- Audit logs (CSV, JSON, PDF)
- Analytics reports (CSV, Excel, PDF)
- Individual projects (Word export)

Full database export requires support assistance.

### How long is deleted data retained?

**Soft Deletes**:
- Projects: 30 days, then permanently deleted
- Users: Deactivated but retained indefinitely

**Permanent Deletes**:
- Cannot be recovered
- Contact support immediately if accidental

### What happens if my subscription expires?

**Read-Only Mode**:
- Can view existing projects
- Can export existing drafts
- Cannot create new projects
- Cannot use AI features

**After 90 Days**:
- Data archived
- Contact support to reactivate

---

## Training and Support

### Is training available?

**Self-Service**:
- Complete user documentation
- Video tutorials (coming soon)
- Quick start guide

**Live Training**:
- Contact admin about firm training
- Custom sessions available
- Webinar series (planned)

### How do I report a bug?

Email support@steno.com with:
- Clear description
- Steps to reproduce
- Screenshots if relevant
- Browser and OS version

### How do I request a feature?

Email support@steno.com with:
- Feature description
- Use case / why needed
- Priority for your firm

Feature requests reviewed quarterly for roadmap.

### Where can I find updates and release notes?

**Coming Soon**:
- In-app changelog
- Email announcements
- Release notes page

Currently: Check with your firm administrator.

---

## Integration and API

### Does Steno have an API?

Yes! See [API Reference](./developer/api-reference.md) for complete documentation.

**Common Uses**:
- Automate project creation
- Bulk document upload
- Custom integrations
- Analytics extraction

### Can I integrate with our case management system?

API enables integration. Contact support for:
- Integration consulting
- Custom development
- Zapier integration (coming soon)

### Does Steno integrate with Microsoft Office?

**Current**:
- Export to .docx (full compatibility)
- Open exports in Word for final editing

**Future**:
- Office 365 add-in (planned)
- Direct editing in Word (exploring)

---

## Future Features

### What's on the roadmap?

**Near Term** (Next 3-6 months):
- Direct PDF export
- Email delivery from Steno
- @mentions in comments
- Improved mobile support
- Template marketplace

**Medium Term** (6-12 months):
- Claude AI option
- Advanced analytics
- Custom AI training on firm documents
- Bulk operations
- Office 365 integration

**Long Term** (12+ months):
- Automated court filing
- Client portal
- E-signature integration
- Multi-language support

**Note**: Roadmap subject to change based on feedback and priorities.

### Can I vote on features?

Feature voting system coming soon. Currently, email support@steno.com with requests.

### Will my feature request be built?

Requests are reviewed quarterly. Factors:
- Number of requests for same feature
- Strategic alignment
- Technical feasibility
- Development resources

High-demand features prioritized.

---

## Still Have Questions?

**Check Documentation**:
- [Getting Started Guide](./user-guide/getting-started.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Admin Guide](./admin-guide/index.md)

**Contact Support**:
- Email: support@steno.com
- Response Time: Within 24 hours (business days)

**Ask Your Admin**:
- Account questions
- Billing inquiries
- Permission requests
- Firm-specific policies
