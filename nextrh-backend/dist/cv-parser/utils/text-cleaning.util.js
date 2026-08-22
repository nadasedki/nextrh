"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanRawText = cleanRawText;
function cleanRawText(text) {
    if (!text)
        return '';
    return text
        .replace(/-- \d+ of \d+ --/g, '')
        .replace(/([-–])\s*\n\s*/g, '$1 ')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/---\s*Page\s*\d+\s*---/gi, '')
        .replace(/Page\s*\d+\s*---/gi, '');
}
//# sourceMappingURL=text-cleaning.util.js.map