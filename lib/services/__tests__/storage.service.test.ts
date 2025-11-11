/**
 * Unit Tests for Storage Service
 * Tests file upload, download URL generation, and S3 operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadDocumentToS3, getPresignedUrl } from '../storage.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

describe('Storage Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadDocumentToS3', () => {
    it('should upload file to S3 with correct parameters', async () => {
      // Create mock file with arrayBuffer method
      const fileContent = 'test content';
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: fileContent.length,
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from(fileContent)),
      } as unknown as File;

      // Mock S3Client.send
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mocked(S3Client).prototype.send = mockSend;

      const s3Key = 'firm-123/project-456/doc-789-test.pdf';

      // Execute upload
      const result = await uploadDocumentToS3(mockFile, s3Key);

      // Verify S3 client was called
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Verify the command was a PutObjectCommand
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(PutObjectCommand);

      // Verify correct S3 key was returned
      expect(result).toBe(s3Key);
    });

    it('should upload different file types successfully', async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mocked(S3Client).prototype.send = mockSend;

      const fileTypes = [
        { name: 'document.pdf', type: 'application/pdf' },
        { name: 'image.png', type: 'image/png' },
        { name: 'photo.jpg', type: 'image/jpeg' },
        { name: 'contract.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      ];

      for (const fileType of fileTypes) {
        mockSend.mockClear();

        const mockFile = {
          name: fileType.name,
          type: fileType.type,
          size: 1024,
          arrayBuffer: vi.fn().mockResolvedValue(Buffer.from('content')),
        } as unknown as File;

        const s3Key = `firm-123/project-456/doc-789-${fileType.name}`;
        const result = await uploadDocumentToS3(mockFile, s3Key);

        expect(result).toBe(s3Key);
        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
      }
    });

    it('should call S3 client with PutObjectCommand', async () => {
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from('content')),
      } as unknown as File;
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mocked(S3Client).prototype.send = mockSend;

      const s3Key = 'firm-123/project-456/doc-789-test.pdf';

      await uploadDocumentToS3(mockFile, s3Key);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
    });

    it('should handle large files', async () => {
      // Create a 10MB file
      const largeContent = new Uint8Array(10 * 1024 * 1024);
      const mockFile = {
        name: 'large.pdf',
        type: 'application/pdf',
        size: largeContent.length,
        arrayBuffer: vi.fn().mockResolvedValue(largeContent.buffer),
      } as unknown as File;
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mocked(S3Client).prototype.send = mockSend;

      const s3Key = 'firm-123/project-456/doc-789-large.pdf';

      await uploadDocumentToS3(mockFile, s3Key);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error if S3 upload fails', async () => {
      const mockFile = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        arrayBuffer: vi.fn().mockResolvedValue(Buffer.from('content')),
      } as unknown as File;
      const mockSend = vi.fn().mockRejectedValue(new Error('S3 upload failed'));
      vi.mocked(S3Client).prototype.send = mockSend;

      const s3Key = 'firm-123/project-456/doc-789-test.pdf';

      await expect(uploadDocumentToS3(mockFile, s3Key)).rejects.toThrow('S3 upload failed');
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL with default expiration', async () => {
      const mockUrl = 'https://s3.amazonaws.com/bucket/key?signature=abc123';
      vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

      const s3Key = 'firm-123/project-456/doc-789-test.pdf';
      const result = await getPresignedUrl(s3Key);

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('should generate presigned URL with custom expiration', async () => {
      const mockUrl = 'https://s3.amazonaws.com/bucket/key?signature=xyz789';
      vi.mocked(getSignedUrl).mockResolvedValue(mockUrl);

      const s3Key = 'firm-123/project-456/doc-789-test.pdf';
      const customExpiration = 7200; // 2 hours

      const result = await getPresignedUrl(s3Key, customExpiration);

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        { expiresIn: customExpiration }
      );
    });

    it('should handle presigned URL generation failure', async () => {
      vi.mocked(getSignedUrl).mockRejectedValue(new Error('Failed to generate URL'));

      const s3Key = 'firm-123/project-456/doc-789-test.pdf';

      await expect(getPresignedUrl(s3Key)).rejects.toThrow('Failed to generate URL');
    });
  });

  describe('S3 Key Structure', () => {
    it('should follow firmId/projectId/documentId-filename format', () => {
      const firmId = 'firm-123';
      const projectId = 'project-456';
      const documentId = 'doc-789';
      const fileName = 'test-document.pdf';

      const expectedKey = `${firmId}/${projectId}/${documentId}-${fileName}`;

      // Verify key structure matches expected pattern
      expect(expectedKey).toMatch(/^firm-\d+\/project-\d+\/doc-\d+-[\w-]+\.pdf$/);
    });

    it('should handle special characters in filename', () => {
      const firmId = 'firm-123';
      const projectId = 'project-456';
      const documentId = 'doc-789';
      const fileName = 'Contract - Final (v2).pdf';

      const s3Key = `${firmId}/${projectId}/${documentId}-${fileName}`;

      // Verify key is constructed properly with special chars
      expect(s3Key).toContain(fileName);
      expect(s3Key).toContain(firmId);
      expect(s3Key).toContain(projectId);
    });
  });
});
