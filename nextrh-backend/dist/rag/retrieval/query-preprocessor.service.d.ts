export declare class QueryPreprocessorService {
    private readonly logger;
    preprocess(question: string): {
        cleaned: string;
        expandedTerms: string[];
    };
    getMeaningfulTokens(question: string): string[];
}
