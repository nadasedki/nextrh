"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMonthYear = parseMonthYear;
exports.parseYearToEndDate = parseYearToEndDate;
exports.parseDateRangeStart = parseDateRangeStart;
exports.parseDateRangeEnd = parseDateRangeEnd;
const cv_parser_constants_1 = require("../constants/cv-parser.constants");
function parseMonthYear(monthStr, yearStr) {
    const month = cv_parser_constants_1.MONTH_MAP[monthStr.toLowerCase().trim()] ?? 0;
    return new Date(Date.UTC(parseInt(yearStr, 10), month, 1));
}
function parseYearToEndDate(yearStr) {
    return new Date(Date.UTC(parseInt(yearStr, 10), 11, 31));
}
function parseDateRangeStart(dateStr) {
    if (dateStr.toLowerCase().startsWith('depuis')) {
        const parts = dateStr.replace(/depuis/i, '').trim().split(/\s+/);
        return parts.length >= 2 ? parseMonthYear(parts[0], parts[1]) : null;
    }
    const rangeParts = dateStr.split(/[-–]/);
    if (rangeParts.length >= 2) {
        const p = rangeParts[0].trim().split(/\s+/);
        if (p.length === 1 && /^\d{4}$/.test(p[0]))
            return parseYearToEndDate(p[0]);
        if (p.length >= 2)
            return parseMonthYear(p[0], p[1]);
    }
    else {
        const p = dateStr.trim().split(/\s+/);
        if (p.length === 1 && /^\d{4}$/.test(p[0]))
            return parseYearToEndDate(p[0]);
        if (p.length >= 2)
            return parseMonthYear(p[0], p[1]);
    }
    return null;
}
function parseDateRangeEnd(dateStr) {
    const rangeParts = dateStr.split(/[-–]/);
    if (rangeParts.length < 2)
        return null;
    const p = rangeParts[1].trim().split(/\s+/);
    if (p.length === 1 && /^\d{4}$/.test(p[0]))
        return parseYearToEndDate(p[0]);
    if (p.length >= 2)
        return parseMonthYear(p[0], p[1]);
    return null;
}
//# sourceMappingURL=date.util.js.map