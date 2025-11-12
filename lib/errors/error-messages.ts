/**
 * User-Friendly Error Messages
 * Story 6.9 - Centralized error messages for consistent UX
 *
 * Used by frontend error handlers to display helpful messages to users
 */

export const ERROR_MESSAGES = {
  // Network & Connection
  NETWORK_ERROR: 'Connection error. Please check your internet and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again in a few moments.',

  // Authentication
  UNAUTHORIZED: 'You need to log in to access this resource.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',

  // Authorization
  FORBIDDEN: 'You do not have permission to perform this action.',
  INSUFFICIENT_PERMISSIONS: 'You need additional permissions to access this resource.',

  // File Upload
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload PDF, DOCX, or image files.',
  FILE_UPLOAD_FAILED: 'File upload failed. Please check the file and try again.',
  FILE_CORRUPTED: 'File appears to be corrupted. Please try another file.',

  // AI Generation
  AI_RATE_LIMIT: 'AI service is temporarily unavailable due to high demand. Please wait a moment.',
  AI_GENERATION_FAILED: 'AI generation failed. Please try again or contact support.',
  AI_QUOTA_EXCEEDED: 'AI usage quota exceeded. Please contact your administrator.',
  AI_TIMEOUT: 'AI generation took too long. Please try with a shorter document.',

  // Export
  EXPORT_FAILED: 'Export failed. Please try again or contact support.',
  EXPORT_FORMAT_UNSUPPORTED: 'Export format not supported. Please choose DOCX or PDF.',
  EMAIL_FAILED: 'Failed to send email. Please try again or download the file directly.',

  // Validation
  VALIDATION_ERROR: 'Please check your input and try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_DATE: 'Please enter a valid date.',

  // Resources
  NOT_FOUND: 'The resource you\'re looking for doesn\'t exist.',
  DRAFT_NOT_FOUND: 'Draft not found. It may have been deleted.',
  PROJECT_NOT_FOUND: 'Project not found. It may have been deleted.',
  TEMPLATE_NOT_FOUND: 'Template not found. It may have been deleted.',
  DOCUMENT_NOT_FOUND: 'Document not found. It may have been deleted.',

  // Collaboration
  COLLABORATOR_ALREADY_EXISTS: 'This user is already a collaborator.',
  CANNOT_REMOVE_OWNER: 'Cannot remove the project owner.',
  VERSION_CONFLICT: 'Someone else has modified this document. Please refresh and try again.',

  // General
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please contact support if this persists.',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Get user-friendly error message by code
 * Falls back to generic message if code not found
 */
export function getErrorMessage(code: string): string {
  const key = code as ErrorMessageKey;
  return ERROR_MESSAGES[key] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Format error for display
 * Extracts the most relevant user-facing information
 */
export function formatErrorForDisplay(error: any): {
  title: string;
  message: string;
  code?: string;
} {
  // Handle API error responses
  if (error?.response?.data?.error) {
    const apiError = error.response.data.error;
    return {
      title: 'Error',
      message: apiError.message || getErrorMessage(apiError.code),
      code: apiError.code,
    };
  }

  // Handle AppError instances
  if (error?.code && error?.userMessage) {
    return {
      title: 'Error',
      message: error.userMessage,
      code: error.code,
    };
  }

  // Handle network errors
  if (error?.message?.includes('Network Error') || error?.message?.includes('ECONNREFUSED')) {
    return {
      title: 'Connection Error',
      message: ERROR_MESSAGES.NETWORK_ERROR,
      code: 'NETWORK_ERROR',
    };
  }

  // Handle timeout errors
  if (error?.message?.includes('timeout')) {
    return {
      title: 'Timeout',
      message: ERROR_MESSAGES.TIMEOUT,
      code: 'TIMEOUT',
    };
  }

  // Fallback for unknown errors
  return {
    title: 'Error',
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    code: 'UNKNOWN_ERROR',
  };
}
