export interface ISectionExtractor<T> {
    extract(sectionText: string): T[];
    isValid(parsedData: T[]): boolean;
}
