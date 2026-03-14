/**
 * Utility functions for safely rendering HTML content in React components
 */

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  let sanitized = html

  // Remove all script tags and their content (multiple patterns to catch edge cases)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remove all style tags with content
  sanitized = sanitized.replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')

  // Remove inline event handlers (onclick, onload, onmouseover, etc.)
  sanitized = sanitized.replace(/\s*on[a-z]+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s*on[a-z]+\s*=\s*[^\s>]*/gi, '')

  // Remove style attributes that might contain javascript
  sanitized = sanitized.replace(/style\s*=\s*["']([^"']*javascript:[^"']*)["']/gi, 'style=""')
  sanitized = sanitized.replace(/style\s*=\s*["']([^"']*)["']/gi, (match, content) => {
    if (content.includes('javascript:') || content.includes('expression')) {
      return 'style=""'
    }
    return match
  })

  // Remove href attributes with javascript: protocol
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')

  // Remove iframe, embed, object tags
  sanitized = sanitized.replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
  sanitized = sanitized.replace(/<\s*embed[^>]*>/gi, '')
  sanitized = sanitized.replace(/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '')

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
