# Fixing "Script Tag While Rendering React Component" Error

## Issue
\`\`\`
Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client.
\`\`\`

## Root Causes
1. **JSX containing literal `<script>` tags** - React doesn't allow script tags in JSX
2. **HTML content with script tags via `dangerouslySetInnerHTML`** - User-provided or loaded HTML containing scripts
3. **Browser cache** - Old build artifacts cached in the browser
4. **Build artifact issues** - Stale compiled code

## Solutions Applied

### 1. HTML Sanitization Utility
Created `/lib/html-sanitizer.ts` with:
- `sanitizeHtml()` - Removes all dangerous content including script tags
- `isSafeHtml()` - Checks if HTML is safe before rendering

### 2. Updated Email Management
- Email preview now uses `sanitizeHtml()` before rendering with `dangerouslySetInnerHTML`
- All user-provided HTML is sanitized to prevent XSS attacks

### 3. Component Best Practices
- Never render `<script>` tags directly in JSX
- Always sanitize user-provided HTML before rendering
- Use `useEffect` with `document.createElement('script')` for external scripts
- Never use template tags in JSX - use conditional rendering instead

## Debugging Steps

If the error persists:

1. **Clear Browser Cache**
   - Cmd+Shift+Delete (Chrome/Firefox on Mac)
   - Ctrl+Shift+Delete (Chrome/Firefox on Windows)
   - Or use DevTools > Network > Disable cache

2. **Check Console for Exact Location**
   - Open browser DevTools (F12)
   - Look for the full error stack trace
   - Identify the component name and line number

3. **Search for Problem File**
   \`\`\`bash
   grep -r "<script" --include="*.tsx" --include="*.jsx"
   grep -r "dangerouslySetInnerHTML" --include="*.tsx" --include="*.jsx"
   \`\`\`

4. **Verify Build**
   - Clear `.next` folder: `rm -rf .next`
   - Rebuild: `npm run build`
   - Deploy fresh build

## Prevention
- Always sanitize external HTML with `sanitizeHtml()`
- Review any component using `dangerouslySetInnerHTML`
- Use TypeScript to catch unsafe patterns
- Add ESLint rules to flag dangerous patterns

## Related Files
- `/lib/html-sanitizer.ts` - Sanitization utilities
- `/app/(admin)/admin/email-management/page.tsx` - Email preview with sanitization
