import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { CertificationEntry } from '../interfaces/cv-extraction.types';
export declare class CertificationExtractorService implements ISectionExtractor<CertificationEntry> {
    private readonly CERT_DATE_ENDING_REGEX;
    private readonly CERT_PARSER_REGEX;
    extract(sectionText: string): CertificationEntry[];
    private extractCertificationsWithoutDate;
    isValid(data: CertificationEntry[]): boolean;
}
