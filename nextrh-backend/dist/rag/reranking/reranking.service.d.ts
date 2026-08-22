import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorSearchResult, RankedResult } from '../types/rag-types';
import { ILlmEngine } from '../../llm/llm.interface';
export declare class RerankingService implements OnModuleInit {
    private readonly llmEngine;
    private readonly configService;
    private readonly logger;
    private stopWords;
    private readonly topK;
    private readonly LAMBDA;
    private readonly STOP_WORDS_PATH;
    constructor(llmEngine: ILlmEngine, configService: ConfigService);
    onModuleInit(): void;
    rerank(question: string, results: VectorSearchResult[], topK?: number): Promise<RankedResult[]>;
    private geminiRerank;
    private lexicalRerank;
}
