import { ISectionExtractor } from '../interfaces/section-extractor.interface';
export declare class SkillsExtractorService implements ISectionExtractor<string> {
    extract(sectionText: string, fullTextFallback?: string): string[];
    private segmentSkillsSection;
    isValid(data: string[]): boolean;
    private formatSkillToken;
    private shouldKeepSkillToken;
}
