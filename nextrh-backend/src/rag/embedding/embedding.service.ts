import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Embeddings } from '@langchain/core/embeddings';
import { EMBEDDING_ENGINE } from '../../llm/llm.interface'; 
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  // Safe chunk character boundary limit
  private readonly MAX_CHARS = 3000;

  // Rate limit config — loaded from .env
  private readonly MAX_RETRIES: number;
  private readonly BASE_RETRY_DELAY_MS: number;

  constructor(
    // 1. Inject the switchable global embedding engine contract [2]
    @Inject(EMBEDDING_ENGINE) private readonly embeddingModel: Embeddings,
    // 2. Inject ConfigService to read retry parameters [1]
    private readonly configService: ConfigService,
  ) {
    this.MAX_RETRIES = this.configService.get<number>('EMBEDDING_MAX_RETRIES', 5);
    this.BASE_RETRY_DELAY_MS = this.configService.get<number>('EMBEDDING_RETRY_DELAY_MS', 10000);

    this.logger.log(`EmbeddingService initialized with Max Retries: ${this.MAX_RETRIES}`);
  }

  /**
   * Sanitizes, clips, and generates vectors.
   * Employs an automated retry loop with rate-limit and backoff detection [2].
   */
  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const cleanText = text.replace(/[\x00-\x1F\x7F]/g, '').slice(0, this.MAX_CHARS);

    // 3. Automated Retry & Backoff Loop
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Delegate query vectorization to the active strategy provider [2]
        const embedding = await this.embeddingModel.embedQuery(cleanText);

        if (!embedding || !Array.isArray(embedding)) {
          throw new Error('Embedding engine returned an invalid coordinate structure.');
        }

        return embedding;

      } catch (err: any) {
        const isRateLimit = this.isRateLimitError(err);
        const isLastAttempt = attempt === this.MAX_RETRIES;

        // If rate limit is hit, calculate backoff delay and try again [1]
        if (isRateLimit && !isLastAttempt) {
          const retryAfterMs = this.extractRetryAfterMs(err) ?? this.BASE_RETRY_DELAY_MS;
          this.logger.warn(
            `Embedding rate limit hit (attempt ${attempt}/${this.MAX_RETRIES}). ` +
            `Waiting ${retryAfterMs}ms before retry...`
          );
          await this.sleep(retryAfterMs);
          continue;
        }

        // If other error occurs, wait a default delay and try again
        if (!isLastAttempt && !isRateLimit) {
          this.logger.warn(
            `Embedding failed (attempt ${attempt}/${this.MAX_RETRIES}): ${err.message}. Retrying...`
          );
          await this.sleep(this.BASE_RETRY_DELAY_MS);
          continue;
        }

        // Final attempt failed: Log critical failure and map to user-friendly HTTP exception
        this.logger.error(`Text vectorization critical failure: ${err.message}`);
        throw new ServiceUnavailableException(
          'The underlying language embedding service failed to process the text array context.'
        );
      }
    }

    throw new ServiceUnavailableException('Embedding failed after all retries.');
  }

  /**
   * Detects 429 Quota Rate limits from the provider's thrown error signatures
   */
  private isRateLimitError(err: any): boolean {
    return err?.message?.includes('429') || err?.message?.includes('Too Many Requests');
  }

  /**
   * Parses Google Gemini API error details to extract custom backoff instructions if present
   */
  private extractRetryAfterMs(err: any): number | null {
    try {
      const message = err?.message ?? '';
      const match = message.match(/"retryDelay"\s*:\s*"([\d.]+)s"/);
      if (match) {
        return Math.ceil(parseFloat(match[1]) * 1000) + 500; // Adds a 500ms safety buffer
      }
    } catch {
      // Ignore parsing errors, safe fallback will be used
    }
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}