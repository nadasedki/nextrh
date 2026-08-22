import { Injectable } from '@nestjs/common';
import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { ProjectEntry } from '../interfaces/cv-extraction.types';
import { PROJECT_ACTION_KEYWORDS } from '../constants/cv-parser.constants';
import { parseYearToEndDate } from '../utils/date.util';
import { isProjectSectionValid } from '../utils/validation.util';
@Injectable()
export class ProjectExtractorService implements ISectionExtractor<ProjectEntry> {
  private readonly PROJECT_DATE_REGEX =
    /^(?:(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4}(?:\s*[-–]\s*(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4})?|\d{4}(?:\s*[-–]\s*\d{4})?)\b/i;

  private readonly projectSplitRegex = new RegExp(
    `\\b(${PROJECT_ACTION_KEYWORDS.join('|')})\\b`,
    'i',
  );

  public extract(sectionText: string): ProjectEntry[] {
    const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const combined: string[] = [];

    for (const line of rawLines) {
      if (/^\s*Année\s+Client\s+Projet\s*$/i.test(line)) continue;
      if (/Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills/i.test(line)) break;

      if (this.PROJECT_DATE_REGEX.test(line)) {
        combined.push(line);
      } else if (combined.length > 0) {
        combined[combined.length - 1] += ` ${line}`;
      } else {
        combined.push(line);
      }
    }

    return combined
      .map(line => this.parseProjectLine(line))
      .filter((p): p is ProjectEntry => p !== null);
  }

  private parseProjectLine(line: string): ProjectEntry | null {
    const dateMatch = line.match(this.PROJECT_DATE_REGEX);
    if (!dateMatch) return null;

    const dateStr = dateMatch[0].trim();
    const payload = line.substring(dateStr.length).trim();
    const years = dateStr.match(/\b\d{4}\b/g) ?? [];
    const startYear = years.length >= 1 ? parseInt(years[0], 10) : new Date().getFullYear();
    const endYear = years.length >= 2 ? parseInt(years[1], 10) : startYear;

    let client = payload;
    let description = '';

    const actionMatch = payload.match(this.projectSplitRegex);
    if (actionMatch?.index !== undefined) {
      client = payload.substring(0, actionMatch.index).trim();
      description = payload.substring(actionMatch.index).trim();
    } else {
      const words = payload.split(/\s+/);
      if (words.length > 3) {
        client = words.slice(0, 3).join(' ');
        description = words.slice(3).join(' ');
      }
    }

    client = client.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
    description = description.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();

    return {
      name: client || 'Client Inconnu',
      client: client || 'Client Inconnu',
      role: 'Consultant / Intervenant',
      description: description || client,
      start_date: null,
      end_date: parseYearToEndDate(endYear.toString()),
      year: dateStr,
    };
  }
public isValid(data: ProjectEntry[]): boolean {
  return isProjectSectionValid(data);
}
  /*public isValid(parsedData: ProjectEntry[]): boolean {
    if (parsedData.length === 0) return false;
    return !parsedData.some(
      p => !p.client || p.client === 'Client Inconnu' || !p.description || p.description.trim().length < 10,
    );
  }*/
}