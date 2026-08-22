import { ConfigService } from '@nestjs/config';
import { VectorService } from '../vector/vector.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { QueryPreprocessorService } from './query-preprocessor.service';
import { VectorSearchResult } from '../types/rag-types';
export declare class RetrievalService {
    private readonly vector;
    private readonly embed;
    private readonly preprocessor;
    private readonly configService;
    private readonly logger;
    private readonly topK;
    constructor(vector: VectorService, embed: EmbeddingService, preprocessor: QueryPreprocessorService, configService: ConfigService);
    retrieve(question: string): Promise<VectorSearchResult[]>;
}
