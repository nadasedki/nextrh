// src/rag/retrieval/retrieval.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorService } from '../vector/vector.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { QueryPreprocessorService } from './query-preprocessor.service'
import { VectorSearchResult } from '../types/rag-types';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  // how many candidates to fetch from Qdrant before reranking
  // over-fetching gives the reranker more to work with
  private readonly topK: number;

  constructor(
    private readonly vector: VectorService,
    private readonly embed: EmbeddingService,
    private readonly preprocessor: QueryPreprocessorService,
    private readonly configService: ConfigService,
  ) {
    this.topK = this.configService.get<number>('RETRIEVAL_TOP_K', 20);
    this.logger.log(`RetrievalService initialized — topK: ${this.topK}`);
  }

  async retrieve(question: string): Promise<VectorSearchResult[]> {

    // step 1 — preprocess the query
    // expands acronyms and removes stop-words before embedding
    // so the embedding model gets a cleaner, more informative input
    const { cleaned, expandedTerms } = this.preprocessor.preprocess(question);

    this.logger.debug(`Original query:     "${question}"`);
    this.logger.debug(`Preprocessed query: "${cleaned}"`);
    if (expandedTerms.length > 0) {
      this.logger.debug(`Expanded terms: [${expandedTerms.join(', ')}]`);
    }

    // step 2 — embed the preprocessed query
    const qVec = await this.embed.embed(cleaned);
    // const qVec = await this.embed.embed(question);
    // step 3 — vector search in Qdrant
    const raw = await this.vector.search(qVec, this.topK);

    // step 4 — map raw Qdrant results to our typed interface
    // Qdrant types payload as Record<string, unknown> so we extract
    // each field individually rather than casting the whole object
    // Inside src/rag/retrieval/retrieval.service.ts -> retrieve()

    // step 4 — map raw Qdrant results to our typed interface [1]
    const results: VectorSearchResult[] = raw.map(hit => ({
      id: Number(hit.id),
      score: hit.score,
      payload: {
        text:         hit.payload?.['text']         as string | undefined,
        type:         hit.payload?.['type']         as string | undefined,
        user_id:      hit.payload?.['user_id']      as number | undefined, 
        entity_id:    hit.payload?.['entity_id']    as number | undefined, 
        full_name:    hit.payload?.['full_name']    as string | undefined,
        source_table: hit.payload?.['source_table'] as string | undefined,
        indexed_at:   hit.payload?.['indexed_at']   as string | undefined,
       
      },
    }));

    this.logger.log(
      `Retrieved ${results.length} candidates for: "${question}" ` +
      `(preprocessed: "${cleaned}")`
    );

    return results;
  }
}