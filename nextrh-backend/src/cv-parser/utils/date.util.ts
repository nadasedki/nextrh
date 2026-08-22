import { MONTH_MAP } from '../constants/cv-parser.constants';

export function parseMonthYear(monthStr: string, yearStr: string): Date {
  const month = MONTH_MAP[monthStr.toLowerCase().trim()] ?? 0;
  return new Date(Date.UTC(parseInt(yearStr, 10), month, 1));
}

export function parseYearToEndDate(yearStr: string): Date {
  return new Date(Date.UTC(parseInt(yearStr, 10), 11, 31));
}

export function parseDateRangeStart(dateStr: string): Date | null {
  if (dateStr.toLowerCase().startsWith('depuis')) {
    const parts = dateStr.replace(/depuis/i, '').trim().split(/\s+/);
    return parts.length >= 2 ? parseMonthYear(parts[0], parts[1]) : null;
  }

  const rangeParts = dateStr.split(/[-–]/);
  if (rangeParts.length >= 2) {
    const p = rangeParts[0].trim().split(/\s+/);
    if (p.length === 1 && /^\d{4}$/.test(p[0])) return parseYearToEndDate(p[0]);
    if (p.length >= 2) return parseMonthYear(p[0], p[1]);
  } else {
    const p = dateStr.trim().split(/\s+/);
    if (p.length === 1 && /^\d{4}$/.test(p[0])) return parseYearToEndDate(p[0]);
    if (p.length >= 2) return parseMonthYear(p[0], p[1]);
  }
  return null;
}

export function parseDateRangeEnd(dateStr: string): Date | null {
  const rangeParts = dateStr.split(/[-–]/);
  if (rangeParts.length < 2) return null;

  const p = rangeParts[1].trim().split(/\s+/);
  if (p.length === 1 && /^\d{4}$/.test(p[0])) return parseYearToEndDate(p[0]);
  if (p.length >= 2) return parseMonthYear(p[0], p[1]);

  return null;
}