import { Injectable } from '@nestjs/common';
import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { CertificationEntry } from '../interfaces/cv-extraction.types';
import { KNOWN_PROVIDERS } from '../constants/cv-parser.constants';
import { parseMonthYear } from '../utils/date.util';
import { isCertificationSectionValid } from '../utils/validation.util';
@Injectable()
export class CertificationExtractorService implements ISectionExtractor<CertificationEntry> {
  private readonly CERT_DATE_ENDING_REGEX =
    /(?:(Janvier|Février|Fevrier|Mars|Avril|Mai|Juin|Juillet|Août|Aout|Septembre|Octobre|Novembre|Décembre|Decembre)\s+)?\(?(\d{4})\)?\s*$/i;

  private readonly CERT_PARSER_REGEX =
    /^(.+?)\s+(?:(Janvier|Février|Fevrier|Mars|Avril|Mai|Juin|Juillet|Août|Aout|Septembre|Octobre|Novembre|Décembre|Decembre)\s+)?\(?(\d{4})\)?\s*$/i;

  public extract(sectionText: string): CertificationEntry[] {
    const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const combined: string[] = [];
    let buffer = '';

    for (const line of rawLines) {
      // Handles straight and curly quotes robustly
      if (/^\s*Certificat[s]?\s+Date\s+d['’]obtention\s*$/i.test(line)) continue;
      if (/^\d+$/.test(line) && !/^\d{4}$/.test(line)) continue;

      buffer = buffer === '' ? line : `${buffer} ${line}`;

      if (this.CERT_DATE_ENDING_REGEX.test(line)) {
        combined.push(buffer);
        buffer = '';
      }
    }
    if (buffer) combined.push(buffer);

    const certifications: CertificationEntry[] = [];

    for (const line of combined) {
      const match = line.match(this.CERT_PARSER_REGEX);
      if (!match) continue;

      let certName = match[1]
        .replace(/^(Certificat|Certification)\s+/gi, '')
        .replace(/^[,\s\-\–\.\*•\(]+|[,\s\-\–\.\*•\(]+$/g, '')
        .trim();

      const monthStr = match[2];
      const yearStr = match[3];

      const provider = KNOWN_PROVIDERS.find(p =>
        new RegExp(p, 'i').test(certName),
      ) ?? 'Professional Issuer';

      const dateStr = monthStr ? `${monthStr} ${yearStr}` : yearStr;
      const issueDate = monthStr
        ? parseMonthYear(monthStr, yearStr)
        : new Date(Date.UTC(parseInt(yearStr, 10), 0, 1));

      certifications.push({
        cert_name: certName,
        provider,
        date: dateStr,
        issue_date: issueDate,
        expiry_date: null,
      });
    }

    if (certifications.length === 0) {
      return this.extractCertificationsWithoutDate(rawLines);
    }

    return certifications;
  }

  private extractCertificationsWithoutDate(rawLines: string[]): CertificationEntry[] {
    const joined: string[] = [];

    for (const line of rawLines) {
      if (/^\s*Certificat[s]?\s+Date\s+d['’]obtention\s*$/i.test(line)) continue;
      if (/^\d+$/.test(line)) continue;

      const clean = line.replace(/^[:\s\-\–\.\*•]+/, '').trim();
      const startsWithProvider = KNOWN_PROVIDERS.some(p =>
        new RegExp(`^${p}`, 'i').test(clean),
      );

      if (startsWithProvider || joined.length === 0) {
        joined.push(clean);
      } else {
        joined[joined.length - 1] += ` ${clean}`;
      }
    }

    return joined
      .filter(line => line.length > 3)
      .map(line => ({
        cert_name: line,
        provider: KNOWN_PROVIDERS.find(p => new RegExp(p, 'i').test(line)) ?? 'Professional Issuer',
        date: null,
        issue_date: null,
        expiry_date: null,
      }));
  }
public isValid(data: CertificationEntry[]): boolean {
  return isCertificationSectionValid(data);
}
 /* public isValid(parsedData: CertificationEntry[]): boolean {
    if (parsedData.length === 0) return false;
    return !parsedData.some(cert => {
      const name = (cert.cert_name ?? '').trim();
      if (name.length < 3) return true;
      if (name.length > 120) return true;
      if (name.split(/\s+/).length > 15) return true;
      if ((name.match(/[:\-|•●▪]/g) ?? []).length > 2) return true;
      return false;
    });
  }*/
}