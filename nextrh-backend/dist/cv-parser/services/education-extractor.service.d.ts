import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { EducationEntry } from '../interfaces/cv-extraction.types';
export declare class EducationExtractorService implements ISectionExtractor<EducationEntry> {
    extract(sectionText: string): EducationEntry[];
    private parseEducationBlock;
    isValid(data: EducationEntry[]): boolean;
}
