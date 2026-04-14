import DOMPurify from 'dompurify';

/**
 * Strip all HTML tags from a string, returning plain text only.
 * Use on any user-supplied free-text before persisting to DB.
 */
export function sanitizeText(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
