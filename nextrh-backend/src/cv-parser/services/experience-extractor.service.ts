import { Injectable } from '@nestjs/common';
import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { ExperienceEntry } from '../interfaces/cv-extraction.types';
import { parseDateRangeStart, parseDateRangeEnd } from '../utils/date.util';
import { isExperienceSectionValid } from '../utils/validation.util';
@Injectable()
export class ExperienceExtractorService implements ISectionExtractor<ExperienceEntry> {
  public extract(sectionText: string): ExperienceEntry[] {
    const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const combined: string[] = [];

    const dateStartRegex =
      /^(Depuis|Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|\b[a-zA-Zà-ÿ]+\s+\d{4}|\b\d{4}\s*[-–]\s*\d{4}|\b\d{4}\b)/i;

    for (const line of rawLines) {
      if (/^\s*Période\s+Organisme\s+Fonction\s+occupée\s*$/i.test(line)) continue;

      if (dateStartRegex.test(line)) {
        combined.push(line);
      } else if (combined.length > 0) {
        combined[combined.length - 1] += ` ${line}`;
      } else {
        combined.push(line);
      }
    }

    const dateRangeRegex =
      /^((?:Depuis\s+)?[a-zA-Zà-ÿ]+\s+\d{4}(?:\s*[-–]\s*[a-zA-Zà-ÿ]+\s+\d{4})?|\b\d{4}\s*[-–]\s*\d{4}\b|\b\d{4}\b)\s+(.+)$/i;

    return combined
      .map(line => this.parseExperienceLine(line, dateRangeRegex))
      .filter((e): e is ExperienceEntry => e !== null);
  }

  private parseExperienceLine(line: string, dateRangeRegex: RegExp): ExperienceEntry | null {
    const match = line.match(dateRangeRegex);
    if (!match) return null;

    const dateStr = match[1].trim();
    const remaining = match[2].trim();

    let company = 'Inconnu';
    let role = remaining;

    const parts = remaining.split(/\t|\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length >= 2) {
      company = parts[0];
      role = parts.slice(1).join(' ');
    } else {
      const words = remaining.split(/\s+/);
      company = words.slice(0, 2).join(' ');
      role = words.slice(2).join(' ');
    }

    return {
      company,
      role,
      period: dateStr,
      start_date: parseDateRangeStart(dateStr),
      end_date: parseDateRangeEnd(dateStr),
      description: role,
    };
  }
public isValid(data: ExperienceEntry[]): boolean {
  return isExperienceSectionValid(data);
}
 
}