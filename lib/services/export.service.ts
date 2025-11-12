/**
 * Export Service
 * Handles exporting drafts to Word documents (.docx)
 * Based on architecture.md and Story 5.7 specifications
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, convertInchesToTwip, ImageRun, Footer, PageNumber } from 'docx';
import { db } from '../db/client';
import { drafts, draftExports, projects, templates, firms } from '../db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../errors';
import { uploadFile, getFile } from './storage.service';
import { v4 as uuidv4 } from 'uuid';

export interface ExportDraftInput {
  draftId: string;
  format?: 'docx' | 'pdf';
  userId: string;
  includeMetadata?: boolean;
  returnBuffer?: boolean; // Whether to return the buffer (for direct download)
}

export interface ExportDraftResult {
  exportId: string;
  fileName: string;
  s3Key?: string;
  fileSize: number;
  presignedUrl?: string;
  buffer?: Buffer;
}

/**
 * Convert Lexical editor content to Word document paragraphs
 * Handles rich text formatting: bold, italic, underline, headings, lists
 */
function convertLexicalToDocx(content: any): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (!content || !content.root || !content.root.children) {
    // Empty content - return single empty paragraph
    return [new Paragraph({ text: '' })];
  }

  const children = content.root.children;

  for (const node of children) {
    if (node.type === 'paragraph') {
      const textRuns: TextRun[] = [];

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (child.type === 'text') {
            textRuns.push(
              new TextRun({
                text: child.text || '',
                bold: child.format?.includes('bold') || child.format === 1,
                italics: child.format?.includes('italic') || child.format === 2,
                underline: child.format?.includes('underline') ? {} : undefined,
              })
            );
          }
        }
      }

      // If no text runs, add empty text
      if (textRuns.length === 0) {
        textRuns.push(new TextRun({ text: '' }));
      }

      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: { after: 200 },
        })
      );
    } else if (node.type === 'heading') {
      const textRuns: TextRun[] = [];

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          if (child.type === 'text') {
            textRuns.push(
              new TextRun({
                text: child.text || '',
                bold: true,
              })
            );
          }
        }
      }

      const headingLevel = node.tag === 'h1' ? HeadingLevel.HEADING_1 :
                          node.tag === 'h2' ? HeadingLevel.HEADING_2 :
                          node.tag === 'h3' ? HeadingLevel.HEADING_3 :
                          HeadingLevel.HEADING_1;

      paragraphs.push(
        new Paragraph({
          children: textRuns,
          heading: headingLevel,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (node.type === 'list') {
      // Handle lists
      if (node.children && node.children.length > 0) {
        for (const listItem of node.children) {
          if (listItem.type === 'listitem' && listItem.children) {
            const textRuns: TextRun[] = [];

            for (const child of listItem.children) {
              if (child.type === 'text') {
                textRuns.push(
                  new TextRun({
                    text: child.text || '',
                    bold: child.format?.includes('bold') || child.format === 1,
                    italics: child.format?.includes('italic') || child.format === 2,
                  })
                );
              }
            }

            paragraphs.push(
              new Paragraph({
                children: textRuns,
                bullet: {
                  level: 0,
                },
                spacing: { after: 100 },
              })
            );
          }
        }
      }
    }
  }

  return paragraphs;
}

/**
 * Convert plain text to Word document paragraphs
 * Fallback when Lexical content parsing fails
 */
function convertPlainTextToDocx(plainText: string): Paragraph[] {
  const lines = plainText.split('\n');
  return lines.map(line => new Paragraph({
    children: [new TextRun({ text: line })],
    spacing: { after: 200 },
  }));
}

/**
 * Generate Word document from draft content
 * Story 5.9: Includes firm letterhead and custom styling
 */
async function generateDocxDocument(
  draft: any,
  project: any,
  template: any,
  firm: any,
  userId: string,
  includeMetadata: boolean = true
): Promise<Buffer> {
  // Convert draft content to paragraphs
  let contentParagraphs: Paragraph[] = [];

  try {
    if (draft.content) {
      contentParagraphs = convertLexicalToDocx(draft.content);
    } else if (draft.plainText) {
      contentParagraphs = convertPlainTextToDocx(draft.plainText);
    } else {
      contentParagraphs = [new Paragraph({ text: 'No content available' })];
    }
  } catch (error) {
    console.error('Error converting content to docx:', error);
    // Fallback to plain text
    if (draft.plainText) {
      contentParagraphs = convertPlainTextToDocx(draft.plainText);
    } else {
      contentParagraphs = [new Paragraph({ text: 'Error loading content' })];
    }
  }

  // Create header with firm letterhead (Story 5.9)
  const headerParagraphs: Paragraph[] = [];

  // Add firm logo if configured
  if (firm.letterheadLogoS3Key) {
    try {
      const logoBuffer = await getFile(firm.letterheadLogoS3Key);
      const imageType = firm.letterheadLogoS3Key.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      headerParagraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: logoBuffer,
              type: imageType,
              transformation: {
                width: 150,
                height: 75,
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    } catch (error) {
      console.error('Error loading firm logo:', error);
      // Continue without logo
    }
  }

  // Add firm name
  if (firm.letterheadCompanyName) {
    headerParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: firm.letterheadCompanyName,
            bold: true,
            size: 28,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );
  }

  // Add firm contact information
  const contactInfo: string[] = [];
  if (firm.letterheadAddress) contactInfo.push(firm.letterheadAddress);
  if (firm.letterheadPhone) contactInfo.push(`Tel: ${firm.letterheadPhone}`);
  if (firm.letterheadEmail) contactInfo.push(`Email: ${firm.letterheadEmail}`);
  if (firm.letterheadWebsite) contactInfo.push(firm.letterheadWebsite);

  if (contactInfo.length > 0) {
    headerParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactInfo.join(' | '),
            size: 18,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Add document title
  headerParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'DEMAND LETTER',
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Add case details if available
  if (project.clientName) {
    headerParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Re: ${project.clientName}`,
            bold: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  if (project.title) {
    headerParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Case: ${project.title}`,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Combine header and content
  const allParagraphs = [...headerParagraphs, ...contentParagraphs];

  // Add metadata footer if requested
  if (includeMetadata) {
    allParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `\nVersion ${draft.currentVersion} - Generated on ${new Date().toLocaleDateString()}`,
            size: 18,
            italics: true,
          }),
        ],
        spacing: { before: 400 },
      })
    );
  }

  // Apply custom margins from firm settings (Story 5.9)
  const margins = firm.exportMargins || { top: 1, bottom: 1, left: 1, right: 1 };

  // Apply custom font settings from firm (Story 5.9)
  const fontFamily = firm.exportFontFamily || 'Times New Roman';
  const fontSize = (firm.exportFontSize || 12) * 2; // Convert to half-points

  // Create footer with page numbers and metadata
  const footerChildren: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];

  if (includeMetadata) {
    footerChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `v${draft.currentVersion} - ${new Date().toLocaleDateString()}`,
            size: 16,
            italics: true,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 100 },
      })
    );
  }

  // Create document with legal formatting
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(margins.top),
              right: convertInchesToTwip(margins.right),
              bottom: convertInchesToTwip(margins.bottom),
              left: convertInchesToTwip(margins.left),
            },
          },
        },
        footers: {
          default: new Footer({
            children: footerChildren,
          }),
        },
        children: allParagraphs,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: fontFamily,
            size: fontSize,
          },
          paragraph: {
            spacing: {
              line: 360, // 1.5 line spacing
            },
          },
        },
      },
    },
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Export draft to Word document (.docx)
 * Generates document, stores in S3, and records export in database
 */
export async function exportDraft(input: ExportDraftInput): Promise<ExportDraftResult> {
  const { draftId, format = 'docx', userId, includeMetadata = true, returnBuffer = false } = input;

  // Only support docx for now
  if (format !== 'docx') {
    throw new Error('Only .docx format is currently supported');
  }

  // Get draft with related project, template, and firm (Story 5.9)
  const draft = await db.query.drafts.findFirst({
    where: eq(drafts.id, draftId),
    with: {
      project: {
        with: {
          template: true,
          firm: true,
        },
      },
    },
  });

  if (!draft) {
    throw new NotFoundError('Draft not found');
  }

  const project = draft.project;
  const template = project.template;
  const firm = project.firm;

  // Generate document
  const buffer = await generateDocxDocument(
    draft,
    project,
    template,
    firm,
    userId,
    includeMetadata
  );

  const fileSize = buffer.length;

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedTitle = project.title.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${sanitizedTitle}_v${draft.currentVersion}_${timestamp}.docx`;

  // Upload to S3 (optional - can be disabled for direct download)
  let s3Key: string | undefined;
  const uploadToS3 = process.env.EXPORT_UPLOAD_TO_S3 !== 'false';

  if (uploadToS3) {
    s3Key = `exports/${project.firmId}/${draftId}/${uuidv4()}.docx`;

    await uploadFile({
      key: s3Key,
      body: buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      metadata: {
        draftId,
        projectId: project.id,
        version: draft.currentVersion.toString(),
        exportedBy: userId,
      },
    });
  }

  // Record export in database (Story 5.10: version tagging)
  const [exportRecord] = await db.insert(draftExports).values({
    draftId,
    version: draft.currentVersion,
    format,
    fileName,
    s3Key,
    fileSize,
    exportedBy: userId,
    metadata: {
      projectTitle: project.title,
      clientName: project.clientName,
      templateName: template?.name || 'Custom',
      letterheadUsed: !!firm.letterheadLogoS3Key,
      exportedAt: new Date().toISOString(),
    },
  }).returning();

  return {
    exportId: exportRecord.id,
    fileName,
    s3Key,
    fileSize,
    buffer: returnBuffer ? buffer : undefined, // Return buffer only if requested
  };
}

/**
 * Get export history for a draft
 */
export async function getDraftExports(draftId: string) {
  const exports = await db.query.draftExports.findMany({
    where: eq(draftExports.draftId, draftId),
    with: {
      exporter: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: (exports, { desc }) => [desc(exports.createdAt)],
  });

  return exports;
}

/**
 * Get single export record
 */
export async function getExport(exportId: string) {
  const exportRecord = await db.query.draftExports.findFirst({
    where: eq(draftExports.id, exportId),
    with: {
      draft: {
        with: {
          project: true,
        },
      },
      exporter: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!exportRecord) {
    throw new NotFoundError('Export not found');
  }

  return exportRecord;
}
