import { OnModuleInit } from '@nestjs/common';
export declare class QueryPreprocessorService implements OnModuleInit {
    private readonly logger;
    private stopWords;
    private readonly STOP_WORDS_PATH;
    onModuleInit(): void;
    preprocess(question: string): {
        cleaned: string;
        expandedTerms: string[];
    };
    getMeaningfulTokens(question: string): string[];
}
