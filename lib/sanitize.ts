import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param dirty - HTML string to sanitize
 * @returns Sanitized HTML string
 * 
 * @example
 * ```ts
 * const clean = sanitizeHtml('<script>alert("xss")</script>Hello')
 * // Returns: 'Hello'
 * ```
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }
  
  // Sanitize HTML - removes script tags, event handlers, etc.
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed - only plain text
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content but remove tags
  })
}

/**
 * Sanitize plain text - removes any HTML tags
 * 
 * @param text - Text to sanitize
 * @returns Sanitized plain text
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  // Remove any HTML tags and return plain text
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

