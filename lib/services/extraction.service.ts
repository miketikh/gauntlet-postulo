/**
 * Text Extraction Service
 * Handles PDF, Word document, and image OCR text extraction from S3 documents
 * Based on architecture.md specifications
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { db } from '../db/client';
import { sourceDocuments } from '../db/schema';
import { eq } from 'drizzle-orm';

const EXTRACTION_TIMEOUT = 120000; // 2 minutes
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'steno-documents-dev';

export interface ExtractionResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
  confidence?: number; // OCR confidence score
}

/**
 * Convert S3 stream to Buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Helper: Download file from S3 to buffer
 */
async function downloadFromS3(s3Key: string): Promise<Buffer> {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('S3 response body is empty');
  }

  return await streamToBuffer(response.Body);
}

/**
 * Normalize extracted text (consistent encoding, whitespace)
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Normalize line endings
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/  +/g, ' ') // Collapse multiple spaces
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Extract text from PDF file in S3
 */
export async function extractPdfText(s3Key: string): Promise<ExtractionResult> {
  try {
    const buffer = await downloadFromS3(s3Key);

    // Extract text with timeout protection
    const textPromise = pdfParse(buffer);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Extraction timeout exceeded 2 minutes')), EXTRACTION_TIMEOUT)
    );

    const data = await Promise.race([textPromise, timeoutPromise]);

    return {
      text: normalizeText(data.text),
      pageCount: data.numpages,
      success: true,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract text from Word document (.docx)
 */
export async function extractWordText(s3Key: string): Promise<ExtractionResult> {
  try {
    const buffer = await downloadFromS3(s3Key);

    const result = await mammoth.extractRawText({ buffer });

    return {
      text: normalizeText(result.value),
      pageCount: 1, // Word docs don't have pages
      success: true,
    };
  } catch (error) {
    console.error('Word extraction error:', error);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract text from image using OCR (Tesseract.js)
 */
export async function extractImageText(s3Key: string): Promise<ExtractionResult> {
  let worker;

  try {
    const buffer = await downloadFromS3(s3Key);

    // Create Tesseract worker
    worker = await createWorker('eng');

    // Perform OCR
    const { data } = await worker.recognize(buffer);

    const confidence = data.confidence;

    // Log warning if confidence is low
    if (confidence < 80) {
      console.warn(`[Extraction] Low OCR confidence (${confidence.toFixed(1)}%) for document ${s3Key}`);
    }

    await worker.terminate();

    return {
      text: normalizeText(data.text),
      pageCount: 1,
      success: true,
      confidence,
    };
  } catch (error) {
    console.error('OCR extraction error:', error);

    if (worker) {
      await worker.terminate();
    }

    return {
      text: '',
      pageCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process document extraction (updates database)
 * This is designed to run asynchronously in the background
 */
export async function processDocumentExtraction(documentId: string): Promise<void> {
  try {
    console.log(`[Extraction] Starting extraction for document ${documentId}`);

    // Get document from database
    const document = await db.query.sourceDocuments.findFirst({
      where: eq(sourceDocuments.id, documentId),
    });

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    console.log(`[Extraction] Document found: ${document.fileName}, type: ${document.fileType}`);

    // Update status to processing
    await db
      .update(sourceDocuments)
      .set({ extractionStatus: 'processing' })
      .where(eq(sourceDocuments.id, documentId));

    console.log(`[Extraction] Status updated to processing`);

    // Route to appropriate extraction method based on file type
    let result: ExtractionResult;

    if (document.fileType === 'application/pdf') {
      result = await extractPdfText(document.s3Key);
    } else if (
      document.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      result = await extractWordText(document.s3Key);
    } else if (document.fileType.startsWith('image/')) {
      result = await extractImageText(document.s3Key);
    } else {
      throw new Error(`Unsupported file type for extraction: ${document.fileType}`);
    }

    // Update database with results
    if (result.success) {
      const updateData: any = {
        extractedText: result.text,
        extractionStatus: 'completed' as const,
      };

      // Store OCR confidence if available
      if (result.confidence !== undefined) {
        updateData.metadata = {
          ocrConfidence: result.confidence,
        };
      }

      await db.update(sourceDocuments).set(updateData).where(eq(sourceDocuments.id, documentId));

      console.log(
        `[Extraction] Successfully extracted ${result.text.length} characters from ${result.pageCount} pages` +
          (result.confidence ? ` (OCR confidence: ${result.confidence.toFixed(1)}%)` : '')
      );
    } else {
      await db
        .update(sourceDocuments)
        .set({
          extractionStatus: 'failed',
          metadata: {
            error: result.error,
          },
        })
        .where(eq(sourceDocuments.id, documentId));

      console.error(`[Extraction] Failed for document ${documentId}: ${result.error}`);
    }
  } catch (error) {
    console.error(`[Extraction] Error processing extraction for ${documentId}:`, error);

    // Update status to failed
    try {
      await db
        .update(sourceDocuments)
        .set({
          extractionStatus: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
        .where(eq(sourceDocuments.id, documentId));
    } catch (dbError) {
      console.error(`[Extraction] Failed to update status to failed:`, dbError);
    }
  }
}
