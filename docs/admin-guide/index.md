# Administrator Guide

## Overview

The Admin Panel provides firm administrators with tools to manage users, configure settings, monitor analytics, and view audit logs. This guide covers all administrative functions in Steno.

**Access**: Navigate to `/dashboard/admin` (requires admin role)

---

## Table of Contents

1. [User Management](#user-management)
2. [Firm Settings](#firm-settings)
3. [Analytics Dashboard](#analytics-dashboard)
4. [Audit Logs](#audit-logs)
5. [Best Practices](#best-practices)

---

## User Management

### Overview

Manage all users in your firm from one centralized interface.

### Viewing Users

**Users List displays:**
- Full name
- Email address
- Role (Admin, Attorney, Paralegal)
- Status (Active, Inactive)
- Last login date
- Number of projects created
- Account creation date

**Sort and Filter:**
- Sort by name, email, role, or last login
- Filter by role (All, Admin, Attorney, Paralegal)
- Filter by status (All, Active, Inactive)
- Search by name or email

### Adding New Users

1. Navigate to **Admin > Users**
2. Click **Add New User**
3. Fill in user details:
   - **First Name**: Required
   - **Last Name**: Required
   - **Email**: Required (must be unique)
   - **Role**: Admin, Attorney, or Paralegal
   - **Temporary Password**: Auto-generated or custom
4. Click **Create User**
5. User receives email with login credentials
6. They must change password on first login

**Role Descriptions:**

**Admin:**
- Full system access
- User management
- Settings configuration
- Analytics and audit logs
- All attorney/paralegal permissions

**Attorney:**
- Create and edit projects
- AI generation and refinement
- Export documents
- Manage templates
- Collaborate with team

**Paralegal:**
- Create and edit projects
- Upload documents
- AI generation
- Export documents
- Cannot manage templates (unless granted)

### Editing User Details

1. Find user in list
2. Click **Edit** (pencil icon)
3. Modify fields:
   - Name
   - Email (triggers verification email)
   - Role (changes permissions immediately)
4. Click **Save Changes**

**Note**: Cannot edit your own admin role (prevents lockout)

### Changing User Roles

**Promoting to Admin:**
1. Edit user
2. Change role to "Admin"
3. Confirm (requires re-entering your password)
4. User gains admin privileges immediately

**Demoting from Admin:**
- Requires at least 2 admins in firm (prevents lockout)
- Confirm action
- User loses admin access immediately

### Resetting Passwords

**For Users:**
1. Edit user
2. Click **Reset Password**
3. Choose method:
   - **Email Reset Link**: User receives email to set new password
   - **Generate Temporary**: Create temp password and share securely
4. Confirm action

**Security Best Practice**: Use email reset links when possible

### Deactivating Users

**When to Deactivate:**
- Employee left firm
- Temporary suspension
- Security concerns

**How to Deactivate:**
1. Edit user
2. Click **Deactivate Account**
3. Confirm action
4. User loses access immediately
5. Projects remain accessible to other team members

**Effects of Deactivation:**
- User cannot log in
- Active sessions terminated
- Email notifications stopped
- Projects/documents preserved
- Can be reactivated later

### Reactivating Users

1. Filter users by "Inactive"
2. Find user
3. Click **Reactivate**
4. User can log in again with previous credentials

### Viewing User Activity

**Activity Metrics:**
- Total projects created
- Documents uploaded
- AI generations requested
- Exports created
- Last login timestamp
- Average session duration

**Detailed Activity:**
1. Click user name
2. View **Activity Tab**:
   - Recent projects
   - Recent exports
   - Login history
   - Comment activity

---

## Firm Settings

### General Information

**Firm Details:**
- Firm Name (displays in letterhead)
- Address
- Phone Number
- Email Address
- Website URL
- State Bar Number (optional)
- Tax ID (optional, for billing)

**Updating Information:**
1. Navigate to **Admin > Settings > General**
2. Edit fields
3. Click **Save Changes**
4. Changes apply to new exports immediately

### Letterhead Configuration

Professional letterhead for exported documents.

#### Logo Upload

**Requirements:**
- **Formats**: PNG, JPG, SVG
- **Max Size**: 5MB
- **Recommended**: 600x300px, transparent background
- **Color**: Full color or grayscale

**Upload Process:**
1. **Admin > Settings > Letterhead**
2. Click **Upload Logo**
3. Select file
4. Crop/resize if needed
5. Click **Save**
6. Logo appears in export preview

**Logo Position:**
- Center (default, recommended)
- Left-aligned
- Right-aligned

#### Company Details

**Letterhead Text:**
- **Firm Name**: Large, bold text below logo
- **Address**: Full mailing address
- **Contact**: Phone, email, website
- **Layout**: Single line or multi-line

**Customization:**
1. Edit text fields
2. Choose layout style
3. Preview changes
4. Save

#### Header Layout Options

**Minimal:**
- Logo only
- Firm name in footer

**Standard (Recommended):**
- Logo centered
- Firm name bold below
- Contact info single line
- Professional and clean

**Detailed:**
- Logo
- Firm name
- Multi-line address
- Phone, email, website separate lines
- State bar number

### Export Preferences

#### Margin Settings

**Default**: 1 inch all sides

**Custom Margins:**
- Top: 0.5 - 2 inches
- Bottom: 0.5 - 2 inches
- Left: 0.5 - 2 inches
- Right: 0.5 - 2 inches

**Presets:**
- **Normal**: 1" all sides
- **Narrow**: 0.75" all sides (more content per page)
- **Wide**: 1.5" all sides (traditional brief format)
- **Court**: Check local rules for specific requirements

#### Font Settings

**Font Family Options:**
- Times New Roman (default, most common)
- Arial
- Calibri
- Georgia
- Garamond

**Font Size:**
- Range: 10pt - 14pt
- Default: 12pt
- Recommended: 12pt for Times New Roman, 11pt for Calibri

**Line Spacing:**
- Single
- 1.5 (default, recommended)
- Double

#### Page Numbers

**Format:**
- "Page X of Y" (default)
- "Page X"
- Roman numerals
- Custom format

**Position:**
- Center (default)
- Right-aligned
- Left-aligned

### Default Templates

**Set Firm Defaults:**
1. **Admin > Settings > Templates**
2. Select templates to mark as default:
   - Personal Injury Demand Letter
   - Contract Breach Demand
   - Property Damage Demand
3. Defaults appear first in template gallery for all users

### AI Configuration (Advanced)

**Model Selection:**
- Current: GPT-4.1-mini (OpenAI)
- Future: Claude 3.7 Sonnet option

**Usage Limits (Optional):**
- Max generations per user per month
- Max tokens per generation
- Cost tracking and alerts

### Email Settings (Coming Soon)

Future feature for SMTP configuration:
- Email server settings
- From address for notifications
- Email templates
- Delivery tracking

---

## Analytics Dashboard

### Overview

Monitor firm usage, track metrics, and identify trends.

### Key Metrics

**Projects:**
- Total projects created
- Active projects (in progress)
- Completed projects
- Projects by status (Draft, In Review, Completed, Sent)

**AI Usage:**
- Total generations
- Total refinements
- Token usage (cost tracking)
- Average generation time
- Success rate

**Exports:**
- Total exports
- Exports by format (.docx, .pdf when available)
- Average file size
- Export frequency

**User Activity:**
- Active users (logged in last 30 days)
- Most active users
- Average session duration
- Peak usage times

### Charts and Visualizations

**Projects Over Time:**
- Line chart showing project creation by month
- Filter by status
- Identify busy periods

**User Activity:**
- Bar chart of projects per user
- Identify power users and low adoption

**AI Token Usage:**
- Track AI costs over time
- Forecast future costs
- Identify heavy users

**Export Statistics:**
- Export counts by day/week/month
- File size trends
- Format preferences

### Filtering Data

**Date Range:**
- Last 7 days
- Last 30 days
- Last 90 days
- Last 12 months
- Custom date range

**User Filter:**
- All users
- Specific user
- Role (Admin, Attorney, Paralegal)

**Project Type:**
- All types
- Personal Injury
- Contract Dispute
- Property Damage
- Custom

### Exporting Analytics

1. Configure filters and date range
2. Click **Export Report**
3. Choose format:
   - CSV (raw data)
   - PDF (formatted report)
   - Excel (.xlsx)
4. Report downloads with charts and data tables

### Usage Monitoring

**Alerts (Coming Soon):**
- High AI token usage
- Unusual activity patterns
- Potential security issues
- License limits approaching

**Current Monitoring:**
- Review analytics weekly
- Track adoption trends
- Identify training needs
- Forecast resource requirements

---

## Audit Logs

### Purpose

Comprehensive audit trail for legal compliance and security monitoring.

### What Gets Logged

**Document Actions:**
- Create project
- View draft
- Edit content
- Export document
- Delete project

**User Actions:**
- Login successful
- Login failed
- Password changed
- Role changed
- Account deactivated

**Template Actions:**
- Create template
- Edit template
- Publish template
- Delete template

**Permissions:**
- Add collaborator
- Remove collaborator
- Change permissions

**Exports:**
- Export created
- Export downloaded
- Export settings used

**Admin Actions:**
- User added
- User modified
- Settings changed
- Audit log viewed

### Viewing Audit Logs

**Access**: Admin > Audit Logs

**Log Entry Contains:**
- **Timestamp**: Exact date and time
- **User**: Who performed action
- **Action**: What was done
- **Resource**: What was affected (project ID, user ID, etc.)
- **IP Address**: Where action originated
- **Result**: Success or failure
- **Metadata**: Additional context (JSON)

### Filtering Audit Logs

**By User:**
- Select specific user
- View all their actions

**By Date Range:**
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

**By Action Type:**
- Login events
- Document actions
- Export actions
- Admin actions
- All actions

**By Resource:**
- Specific project ID
- Specific user ID
- Specific template ID

**By Result:**
- Successful actions only
- Failed actions only (security focus)
- All results

### Searching Audit Logs

**Search Fields:**
- User email
- IP address
- Project title
- Action description
- Resource ID

**Search Tips:**
- Use quotes for exact match: "john@firm.com"
- Wildcard searches: "project*"
- Combine filters for specific results

### Exporting Audit Logs

**For Compliance Reporting:**

1. Configure filters (date range, user, action type)
2. Click **Export Audit Log**
3. Choose format:
   - **CSV**: Raw data for analysis
   - **PDF**: Formatted report with headers
   - **JSON**: Complete data with metadata
4. Download file
5. Store securely per retention policy

**Required Exports:**
- Annual compliance audit
- Security incident investigation
- Client request (with appropriate authorization)
- Litigation hold requirements

### Retention Policy

**Legal Requirements:**
- **Minimum**: 7 years retention
- **Method**: Archived to S3 Glacier after 90 days
- **Access**: Available for retrieval within 24 hours
- **Security**: Encrypted at rest and in transit

**Automatic Archival:**
- Logs older than 90 days move to cold storage
- Cost-effective long-term retention
- Retrievable for compliance needs

### Security Monitoring

**Red Flags to Watch:**
- **Multiple Failed Logins**: Potential brute force attack
- **Access from New IP**: Possible account compromise
- **Unusual Activity Hours**: After-hours access
- **Bulk Exports**: Data exfiltration attempt
- **Permission Changes**: Unauthorized privilege escalation

**Response Procedure:**
1. Review audit log details
2. Contact user if suspicious
3. Reset password if compromised
4. Deactivate account if necessary
5. Document incident
6. Report to IT security if serious

### Compliance Uses

**Attorney-Client Privilege:**
- Document who accessed client information
- Prove appropriate access controls
- Respond to privilege challenges

**Data Breach Response:**
- Identify scope of breach
- Determine affected users/documents
- Timeline reconstruction
- Regulatory reporting

**Internal Investigations:**
- Employee misconduct
- Unauthorized access
- Policy violations

**External Audits:**
- Export logs for auditors
- Demonstrate compliance
- Prove data handling procedures

---

## Best Practices

### User Onboarding

**New Employee Checklist:**
1. Create user account (appropriate role)
2. Send welcome email with credentials
3. Schedule training session
4. Assign to first project (with mentor)
5. Follow up after 1 week

**Training Recommendations:**
- 30-minute live demo for new users
- Provide access to user guides
- Assign practice project
- Schedule follow-up Q&A

### Security Recommendations

**User Management:**
- Review users quarterly
- Deactivate ex-employees immediately
- Use strong password requirements
- Enable two-factor authentication (when available)

**Access Control:**
- Principle of least privilege
- Grant admin sparingly
- Review permissions regularly
- Remove access when projects complete

**Monitoring:**
- Check audit logs weekly
- Review failed login attempts
- Monitor unusual activity patterns
- Respond promptly to alerts

### Regular Maintenance

**Weekly Tasks:**
- Review new users
- Check audit logs for anomalies
- Monitor AI usage trends

**Monthly Tasks:**
- Review user activity metrics
- Check for inactive users
- Update firm settings if needed
- Export usage report for billing

**Quarterly Tasks:**
- Full user audit (remove ex-employees)
- Review all admin accounts
- Update templates if needed
- Security review

**Annual Tasks:**
- Export full audit log for compliance
- Review and update firm policies
- Evaluate usage patterns for next year
- Renew licenses/subscriptions

### Cost Management

**Monitor AI Usage:**
- Track token consumption
- Identify heavy users
- Educate on efficient prompting
- Set alerts for unusual usage

**Storage Management:**
- Review total document storage
- Archive completed projects
- Clean up duplicate uploads
- Monitor export file sizes

**License Optimization:**
- Remove inactive users
- Right-size user count
- Review feature usage
- Adjust subscription tier if needed

### Template Management

**Best Practices:**
- Create templates for common case types
- Review and update quarterly
- Get attorney input on improvements
- Version control for templates
- Test before publishing

**Organization:**
- Clear naming convention
- Descriptive names
- Tag by practice area
- Mark as default if appropriate

### User Adoption

**Encourage Usage:**
- Regular training sessions
- Share success stories
- Highlight time savings
- Recognize power users
- Gather feedback

**Address Resistance:**
- One-on-one training
- Address specific concerns
- Show relevant examples
- Gradual rollout
- Executive sponsorship

### Data Backup

**Automatic Backups:**
- Daily database backups
- S3 versioning for documents
- Point-in-time recovery available
- 30-day retention

**Your Responsibilities:**
- Export critical templates
- Download important documents
- Keep local copies of final exports
- Document firm-specific workflows

---

## Troubleshooting

### Cannot Access Admin Panel

**Problem**: Admin menu item not visible or access denied

**Solutions:**
- Verify your account has admin role
- Log out and log back in
- Clear browser cache
- Contact another admin to verify your role

### Users Not Receiving Invitation Emails

**Problem**: New users don't get credentials

**Solutions:**
- Check spam/junk folders
- Verify email address is correct
- Resend invitation
- Manually share credentials securely
- Check email service status

### Letterhead Not Appearing in Exports

**Problem**: Users report missing letterhead

**Solutions:**
- Verify logo is uploaded in settings
- Check logo file is valid (PNG/JPG, <5MB)
- Test export yourself
- Verify "Include Letterhead" is checked
- Re-upload logo if corrupted

### Audit Logs Missing Data

**Problem**: Can't find expected log entries

**Solutions:**
- Verify date range includes event time
- Check all filters are cleared
- Try searching by resource ID
- Confirm action type filter is "All"
- Contact support if data truly missing

---

## Support and Resources

### Getting Help

**For Admins:**
- Email: admin-support@steno.com
- Priority support response
- Dedicated admin documentation

**For General Questions:**
- Standard support: support@steno.com
- User guides in Help Center
- Video tutorials (coming soon)

### Additional Resources

- [Developer Documentation](../developer/setup.md) - For technical integration
- [API Reference](../developer/api-reference.md) - For automation
- [User Guides](../user-guide/getting-started.md) - For end users
- [Troubleshooting](../troubleshooting.md) - Common issues

---

## Contact

Questions about administration?
- **Email**: admin-support@steno.com
- **Response Time**: Within 8 hours (business days)
- **Urgent Issues**: Mark email as "URGENT"
