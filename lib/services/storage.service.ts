/**
 * S3 Storage Service
 * Handles file uploads, downloads, and presigned URLs for document storage
 * Based on architecture.md AWS S3 specifications
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'steno-documents-dev';

export interface UploadFileParams {
  key: string;
  body: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface PresignedUrlParams {
  key: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

/**
 * Upload a file to S3
 */
export async function uploadFile(params: UploadFileParams): Promise<string> {
  const { key, body, contentType, metadata } = params;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await s3Client.send(command);

  return key;
}

/**
 * Generate presigned URL for downloading a file
 * URL expires after specified time (default 1 hour)
 */
export async function getPresignedDownloadUrl(
  params: PresignedUrlParams
): Promise<string> {
  const { key, expiresIn = 3600 } = params;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Generate presigned URL for uploading a file directly from client
 * URL expires after specified time (default 1 hour)
 */
export async function getPresignedUploadUrl(
  params: PresignedUrlParams
): Promise<string> {
  const { key, expiresIn = 3600 } = params;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Test S3 connection by attempting to list bucket
 */
export async function testS3Connection(): Promise<boolean> {
  try {
    // Try to upload and delete a test file
    const testKey = `test/${Date.now()}.txt`;
    const testContent = Buffer.from('Connection test');

    await uploadFile({
      key: testKey,
      body: testContent,
      contentType: 'text/plain',
    });

    const exists = await fileExists(testKey);

    await deleteFile(testKey);

    return exists;
  } catch (error) {
    console.error('S3 connection test failed:', error);
    return false;
  }
}

/**
 * Upload document file to S3
 * Convenience wrapper for File objects from multipart form data
 */
export async function uploadDocumentToS3(file: File, s3Key: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: file.type,
    ServerSideEncryption: 'AES256', // Using AES256 encryption (can switch to aws:kms for KMS)
    Metadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);
  return s3Key;
}

/**
 * Get presigned URL for secure download
 * Alias for getPresignedDownloadUrl with simpler signature
 */
export async function getPresignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
  return getPresignedDownloadUrl({
    key: s3Key,
    expiresIn,
  });
}
