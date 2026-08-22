/**
 * Canonical helper to sanitize and clean raw extracted PDF text.
 */
export function cleanRawText(text: string): string {
  if (!text) return '';
  return text
    .replace(/-- \d+ of \d+ --/g, '')
    .replace(/([-–])\s*\n\s*/g, '$1 ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/---\s*Page\s*\d+\s*---/gi, '')
    .replace(/Page\s*\d+\s*---/gi, '');
}