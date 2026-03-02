/**
 * Utility functions for safely rendering HTML content in React components
 */

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Remove all script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove inline event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Remove on attributes without quotes
  sanitized = sanitized.replace(/\s*on\w+\s*=/gi, ' data-blocked-')

  // Remove style attributes that might contain javascript: protocol
  sanitized = sanitized.replace(/style\s*=\s*["']([^"']*javascript:[^"']*)["']/gi, '')

  // Remove href attributes with javascript: protocol
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')

  // Remove data attributes with javascript
  sanitized = sanitized.replace(/data:[^/]*\/[^,]*,/gi, '')

  return sanitized
}

export function isSafeHtml(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return true
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script/gi,
    /on\w+\s*=/gi,
    /javascript:/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
  ]

  return !dangerousPatterns.some(pattern => pattern.test(html))
}
