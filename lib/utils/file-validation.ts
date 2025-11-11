/**
 * File Validation Utilities
 * Validates file types and sizes for document uploads
 * Based on Story 2.1 requirements
 */

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file's type and size
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload PDF, DOCX, JPEG, or PNG files.'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 50MB limit.'
    };
  }

  return { valid: true };
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Gets the file icon type for display
 */
export function getFileIconType(file: File): 'pdf' | 'doc' | 'image' {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.includes('wordprocessingml')) return 'doc';
  if (file.type.startsWith('image/')) return 'image';
  return 'doc';
}
