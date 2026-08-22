import { Injectable } from '@nestjs/common';
import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { EducationEntry } from '../interfaces/cv-extraction.types';
import { isEducationSectionValid } from '../utils/validation.util';
@Injectable()
export class EducationExtractorService implements ISectionExtractor<EducationEntry> {
  public extract(sectionText: string): EducationEntry[] {
    const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const education: EducationEntry[] = [];
    let currentYear = '';
    let block: string[] = [];

    for (const line of rawLines) {
      if (/^\s*(Année|Période)\s+Institution\s+Diplôme\s*$/i.test(line)) continue;

      const yearMatch = line.match(/^(\d{4}(?:\s*[-–]\s*\d{4})?)\b\s*(.*)$/);
      if (yearMatch) {
        if (currentYear && block.length > 0) {
          education.push(this.parseEducationBlock(currentYear, block));
        }
        currentYear = yearMatch[1].trim();
        block = yearMatch[2].trim() ? [yearMatch[2].trim()] : [];
      } else {
        block.push(line);
      }
    }

    if (currentYear && block.length > 0) {
      education.push(this.parseEducationBlock(currentYear, block));
    }

    return education;
  }

  private parseEducationBlock(yearStr: string, lines: string[]): EducationEntry {
    const text = lines.join(' ').replace(/\s+/g, ' ').trim();
    const degreeMatch = text.match(
      /\b(Diplôme|Licence|Baccalauréat|Classes préparatoires|Classes|Ingénieur|Master|Doctorat|Option|Technicien)\b/i,
    );

    let institution = '';
    let degree = '';

    if (degreeMatch?.index !== undefined) {
      institution = text.substring(0, degreeMatch.index).trim();
      degree = text.substring(degreeMatch.index).trim();
    } else {
      institution = text;
    }

    institution = institution.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
    degree = degree.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();

    const parts = yearStr.split(/[-–]/);
    const endYear = parts.length >= 2 ? parseInt(parts[1].trim(), 10) : parseInt(yearStr, 10);
    const startYear = parts.length >= 2 ? parseInt(parts[0].trim(), 10) : null;

    return { degree, institution, year: yearStr, start_year: startYear, end_year: endYear };
  }
public isValid(data: EducationEntry[]): boolean {
  return isEducationSectionValid(data);
}
  /*public isValid(parsedData: EducationEntry[]): boolean {
    if (parsedData.length === 0) return false;
    return !parsedData.some(e => !e.institution || !e.degree || e.degree.trim().length < 5);
  }*/
}