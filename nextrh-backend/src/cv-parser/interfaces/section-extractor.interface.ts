export interface ISectionExtractor<T> {
  /**
   * Parse raw section text string using fast heuristics (regexes, line buffers)
   */
  extract(sectionText: string): T[];

  /**
   * Quality gate: Evaluates if parsed data meets structural validation criteria
   */
  isValid(parsedData: T[]): boolean;
}