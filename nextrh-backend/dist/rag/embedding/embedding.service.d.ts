import { ConfigService } from '@nestjs/config';
import { Embeddings } from '@langchain/core/embeddings';
export declare class EmbeddingService {
    private readonly embeddingModel;
    private readonly configService;
    private readonly logger;
    private readonly MAX_CHARS;
    private readonly MAX_RETRIES;
    private readonly BASE_RETRY_DELAY_MS;
    constructor(embeddingModel: Embeddings, configService: ConfigService);
    embed(text: string): Promise<number[]>;
    private isRateLimitError;
    private extractRetryAfterMs;
    private sleep;
}
