import DOMPurify from 'dompurify';

/**
 * HTML 콘텐츠를 정제하여 XSS 공격 방지
 * @param html 정제할 HTML 문자열
 * @returns 안전한 HTML 문자열
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  });
}
