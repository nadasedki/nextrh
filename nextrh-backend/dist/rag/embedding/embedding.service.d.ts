import { Embeddings } from '@langchain/core/embeddings';
export declare class EmbeddingService {
    private readonly embeddingModel;
    private readonly logger;
    private readonly MAX_CHARS;
    constructor(embeddingModel: Embeddings);
    embed(text: string): Promise<number[]>;
}
