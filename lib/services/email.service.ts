/**
 * Email Service
 * Handles sending emails with attachments via Resend
 * Part of Story 5.11 - Email Export Delivery
 */

import { Resend } from 'resend';

// Lazy-initialize Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface SendExportEmailParams {
  to: string | string[];
  subject: string;
  attachmentBuffer: Buffer;
  attachmentFilename: string;
  firmName: string;
  projectTitle: string;
  senderEmail?: string;
}

/**
 * Send exported document via email
 * Uses Resend for email delivery with document attachment
 */
export async function sendExportEmail(params: SendExportEmailParams): Promise<void> {
  const {
    to,
    subject,
    attachmentBuffer,
    attachmentFilename,
    firmName,
    projectTitle,
    senderEmail = 'noreply@yourdomain.com', // TODO: Configure actual domain
  } = params;

  // Prepare email body
  const emailBody = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border: 1px solid #e9ecef;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${firmName}</h2>
          </div>
          <div class="content">
            <h3>Demand Letter - ${projectTitle}</h3>
            <p>Dear Recipient,</p>
            <p>Please find attached the demand letter for <strong>${projectTitle}</strong>.</p>
            <p>The document is attached to this email as <strong>${attachmentFilename}</strong>.</p>
            <p>If you have any questions or concerns, please contact us at your earliest convenience.</p>
            <p>Best regards,<br>${firmName}</p>
          </div>
          <div class="footer">
            <p>This email was sent automatically from Postulo.</p>
            <p>© ${new Date().getFullYear()} ${firmName}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send email via Resend
  const client = getResendClient();
  await client.emails.send({
    from: `${firmName} <${senderEmail}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: emailBody,
    attachments: [
      {
        filename: attachmentFilename,
        content: attachmentBuffer,
      },
    ],
  });
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(to: string): Promise<void> {
  const client = getResendClient();
  await client.emails.send({
    from: 'Postulo <noreply@yourdomain.com>', // TODO: Configure actual domain
    to,
    subject: 'Postulo Email Service Test',
    html: '<p>This is a test email from Postulo. If you received this, email service is working correctly.</p>',
  });
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
