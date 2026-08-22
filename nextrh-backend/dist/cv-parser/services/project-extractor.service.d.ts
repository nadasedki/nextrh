import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { ProjectEntry } from '../interfaces/cv-extraction.types';
export declare class ProjectExtractorService implements ISectionExtractor<ProjectEntry> {
    private readonly PROJECT_DATE_REGEX;
    private readonly projectSplitRegex;
    extract(sectionText: string): ProjectEntry[];
    private parseProjectLine;
    isValid(data: ProjectEntry[]): boolean;
}
