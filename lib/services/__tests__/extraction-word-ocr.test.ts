/**
 * Unit tests for Word and OCR extraction
 * Tests extraction from DOCX files and images using OCR
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractWordText, extractImageText } from '../extraction.service';

// Mock dependencies
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  GetObjectCommand: vi.fn(),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
}));

describe('Text Normalization', () => {
  // Import the internal function for testing
  // Since normalizeText is not exported, we'll test it through the extraction functions

  it('should normalize line endings in extracted text', async () => {
    const mammoth = await import('mammoth');
    vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
      value: 'Line 1\r\nLine 2\rLine 3\nLine 4',
      messages: [],
    });

    // Mock S3 download
    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('test');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractWordText('test-key');

    expect(result.success).toBe(true);
    expect(result.text).toBe('Line 1\nLine 2\nLine 3\nLine 4');
  });

  it('should collapse multiple spaces', async () => {
    const mammoth = await import('mammoth');
    vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
      value: 'Word1    Word2  Word3',
      messages: [],
    });

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('test');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractWordText('test-key');

    expect(result.success).toBe(true);
    expect(result.text).toBe('Word1 Word2 Word3');
  });

  it('should replace tabs with spaces', async () => {
    const mammoth = await import('mammoth');
    vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
      value: 'Word1\tWord2\tWord3',
      messages: [],
    });

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('test');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractWordText('test-key');

    expect(result.success).toBe(true);
    expect(result.text).toBe('Word1 Word2 Word3');
  });
});

describe('Word Document Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract text from DOCX file', async () => {
    const mammoth = await import('mammoth');
    vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
      value: 'This is test content from a Word document.',
      messages: [],
    });

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('test docx content');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractWordText('test-key');

    expect(result.success).toBe(true);
    expect(result.text).toBe('This is test content from a Word document.');
    expect(result.pageCount).toBe(1); // Word docs don't have pages
    expect(result.error).toBeUndefined();
  });

  it('should handle empty Word documents', async () => {
    const mammoth = await import('mammoth');
    vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
      value: '',
      messages: [],
    });

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractWordText('test-key');

    expect(result.success).toBe(true);
    expect(result.text).toBe('');
  });

  it('should handle malformed DOCX files', async () => {
    const mammoth = await import('mammoth');
    vi.mocked(mammoth.default.extractRawText).mockRejectedValue(new Error('Invalid DOCX format'));

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('invalid data');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractWordText('test-key');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid DOCX format');
    expect(result.text).toBe('');
  });
});

describe('OCR Image Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract text from image with high confidence', async () => {
    const tesseract = await import('tesseract.js');
    const mockWorker = {
      recognize: vi.fn().mockResolvedValue({
        data: {
          text: 'This is clear text from an image',
          confidence: 95.5,
        },
      }),
      terminate: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(tesseract.createWorker).mockResolvedValue(mockWorker as any);

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('image data');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractImageText('test-key');

    expect(result.success).toBe(true);
    expect(result.text).toBe('This is clear text from an image');
    expect(result.confidence).toBe(95.5);
    expect(result.pageCount).toBe(1);
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should warn on low confidence OCR (below 80%)', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const tesseract = await import('tesseract.js');
    const mockWorker = {
      recognize: vi.fn().mockResolvedValue({
        data: {
          text: 'Blurry text',
          confidence: 65.0,
        },
      }),
      terminate: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(tesseract.createWorker).mockResolvedValue(mockWorker as any);

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('poor quality image');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractImageText('test-key');

    expect(result.success).toBe(true);
    expect(result.confidence).toBe(65.0);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Low OCR confidence (65.0%)')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle OCR failures gracefully', async () => {
    const tesseract = await import('tesseract.js');
    const mockWorker = {
      recognize: vi.fn().mockRejectedValue(new Error('OCR processing failed')),
      terminate: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(tesseract.createWorker).mockResolvedValue(mockWorker as any);

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('image data');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    const result = await extractImageText('test-key');

    expect(result.success).toBe(false);
    expect(result.error).toBe('OCR processing failed');
    expect(result.text).toBe('');
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should terminate worker even on errors', async () => {
    const tesseract = await import('tesseract.js');
    const mockWorker = {
      recognize: vi.fn().mockRejectedValue(new Error('Processing error')),
      terminate: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(tesseract.createWorker).mockResolvedValue(mockWorker as any);

    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      Body: {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('data');
        },
      },
    });
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend } as any));

    await extractImageText('test-key');

    expect(mockWorker.terminate).toHaveBeenCalled();
  });
});
