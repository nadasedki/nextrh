import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { ExperienceEntry } from '../interfaces/cv-extraction.types';
export declare class ExperienceExtractorService implements ISectionExtractor<ExperienceEntry> {
    extract(sectionText: string): ExperienceEntry[];
    private parseExperienceLine;
    isValid(data: ExperienceEntry[]): boolean;
}
