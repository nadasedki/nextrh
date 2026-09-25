import { Inject, Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Embeddings } from '@langchain/core/embeddings';
import { EMBEDDING_ENGINE } from '../../llm/llm.interface';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly MAX_CHARS = 20000;

  constructor(
    @Inject(EMBEDDING_ENGINE) private readonly embeddingModel: Embeddings,
  ) {}

  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const cleanText = text.replace(/[\x00-\x1F\x7F]/g, '').slice(0, this.MAX_CHARS);

    try {
     const vector = await this.embeddingModel.embedQuery(cleanText);

      if (!vector || !Array.isArray(vector)) {
        throw new Error('Embedding engine returned an invalid vector structure.');
      }

      return vector;
    } catch (error: any) {
      this.logger.error(`Failed to generate vector embedding: ${error.message}`);
       throw new InternalServerErrorException(`Embedding generation failed: ${error.message}`);
    }
  }
}