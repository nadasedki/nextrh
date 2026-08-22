import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { VectorSearchResult, RankedResult } from '../types/rag-types';
import { ILlmEngine, LLM_ENGINE } from '../../llm/llm.interface';

// Define the strict structured JSON schema for Gemini reranking 
const RERANKING_SCHEMA = {
  type: 'object',
  properties: {
    ranked_ids: {
      type: 'array',
      items: { type: 'number' },
      description: 'List of the input sequential document IDs, sorted strictly by semantic relevance to the query, highest relevance first.',
    }
  },
  required: ['ranked_ids']
};

@Injectable()
export class RerankingService implements OnModuleInit {
  private readonly logger = new Logger(RerankingService.name);

  // Stop-words set for lexical fallback processing [1]
  private stopWords: Set<string> = new Set();

  // Multi-tier configurations [1]
  private readonly topK: number;
  private readonly LAMBDA = 0.15; // Lambda constant for lexical keyword boosting balance

  private readonly STOP_WORDS_PATH = path.join(
    process.cwd(),
    'src/rag/reranking/config/stop-words.json',
  );

  constructor(
    // 1. Inject the switchable AI Engine factory token [2]
    @Inject(LLM_ENGINE) private readonly llmEngine: ILlmEngine,
    private readonly configService: ConfigService,
  ) {
    this.topK = this.configService.get<number>('RERANKER_TOP_K', 5);
  }

  /**
   * Load stop-words file once into memory at application startup [1]
   */
  onModuleInit() {
    try {
      if (fs.existsSync(this.STOP_WORDS_PATH)) {
        const raw = fs.readFileSync(this.STOP_WORDS_PATH, 'utf-8');
        const config = JSON.parse(raw);
        this.stopWords = new Set<string>(config.words);
        this.logger.log(
          `Stop-words loaded: ${this.stopWords.size} words (${config.metadata.languages.join(', ')})`
        );
      } else {
        this.logger.warn(`Stop-words file missing at ${this.STOP_WORDS_PATH}. Lexical fallback will run unfiltered.`);
      }
    } catch (error: any) {
      this.logger.error(`Could not initialize stop-words catalog: ${error.message}.`);
      this.stopWords = new Set();
    }
  }

  /**
   * Orchestrates the Triple-Tier Reranking process [1]:
   * - Tier 1: Gemini Listwise AI Reranker (Primary) [1, 2]
   * - Tier 2: Heuristic Lexical Keyword Booster (Fallback) [1]
   * - Tier 3: Raw Qdrant Similarity Scores (Fail-Safe) [1]
   */
  async rerank(
    question: string,
    results: VectorSearchResult[],
    topK?: number,
  ): Promise<RankedResult[]> {
    const k = topK ?? this.topK;

    if (!results || results.length === 0) {
      return [];
    }

    try {
      // ─── TIER 1: SEMANTIC GEMINI LISTWISE RERANKING ────────────────────────
      return await this.geminiRerank(question, results, k);

    } catch (err: any) {
      this.logger.warn(
        `[RERANKER] Gemini evaluation failed: ${err.message}. ` +
        `Gracefully degrading to local Lexical Booster...` // ◄ Fail-soft degradation [1]
      );

      // ─── TIER 2: LOCAL LEXICAL KEYWORD OVERLAP BOOSTER (FALLBACK) ──────────
      try {
        return this.lexicalRerank(question, results, k);
      } catch (lexicalErr: any) {
        this.logger.error(`[RERANKER] Local Lexical fallback failed: ${lexicalErr.message}. Falling back to raw vector order.`);
        
        // ─── TIER 3: RAW VECTOR SIMILARITY (FAIL-SAFE) ─────────────────────────
        return [...results]
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, k) as RankedResult[];
      }
    }
  }

  /**
   * Evaluates document chunk priority using a structured Gemini listwise call [1, 2]
   */
  private async geminiRerank(
    question: string,
    results: VectorSearchResult[],
    topK: number,
  ): Promise<RankedResult[]> {
    // 1. Construct a text block of candidate documents
    const docSelectionBlock = results
      .map((res) => `[ID: ${res.id}] Content: ${res.payload?.text || ''}`)
      .join('\n\n');

    // 2. Draft the specialized LLM evaluation prompt
    const prompt = `You are an expert Information Retrieval (IR) semantic reranking system.

Query: "${question}"

Below is a list of candidate document chunks retrieved from a vector database. 
Evaluate each chunk's semantic relevance to the user's Query. 
Sort the document IDs from most relevant to least relevant. Return ONLY the sorted list of IDs.

CANDIDATE DOCUMENTS:
---
${docSelectionBlock}
---`;

    // 3. Delegate structured evaluation to the dynamic LLM Strategy [2]
    // Uses Google's fast current-gen model to evaluate candidate metrics
    const response = await this.llmEngine.generateStructured<{ ranked_ids: number[] }>(
      prompt,
      RERANKING_SCHEMA,
      {
        model: 'gemini-2.5-flash', // Overrides to Google's active developer-tier model [1]
        temperature: 0,
      }
    );

    const rankedIds = response?.ranked_ids || [];
    this.logger.log(`[RERANKER] Gemini reordered candidate chunk priority: [${rankedIds.join(', ')}]`);

    // 4. Re-sort the original results matching Gemini's ranked_ids order
    const mappedResults = new Map(results.map(r => [r.id, r]));
    const sortedResults: RankedResult[] = [];

    for (const id of rankedIds) {
      const matchedRecord = mappedResults.get(id);
      if (matchedRecord) {
        sortedResults.push({
          ...matchedRecord,
          score: 1.0 - (sortedResults.length * 0.05), // Assign safe pseudo-descending scores [1]
        } as RankedResult);
      }
    }

    // 5. Rollback safety: Fill in any chunks that the LLM skipped to prevent data loss [1]
    for (const res of results) {
      if (!rankedIds.includes(res.id)) {
        sortedResults.push({
          ...res,
          score: res.score || 0,
        } as RankedResult);
      }
    }

    return sortedResults.slice(0, topK);
  }

  /**
   * High-speed, local exact-match keyword relevance booster [1]
   * Filters out multi-lingual stop-words once loaded at module initialization [1]
   */
  private lexicalRerank(
    question: string,
    results: VectorSearchResult[],
    topK: number,
  ): RankedResult[] {
    // Clean and split the query into lowercase tokens
    const rawTokens = question
      .toLowerCase()
      .replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s]/gi, '')
      .split(/\s+/)
      .filter(t => t.length > 0);

    // Drop structural stop-words (keeps words containing domain meanings) [1]
    const meaningfulTokens = rawTokens.filter(t => !this.stopWords.has(t));

    this.logger.debug(`[RERANKER-LEXICAL] Extracted tokens: [${meaningfulTokens.join(', ')}]`);

    // If everything was structural (no meaningful words), fall back to raw vector similarity [1]
    if (meaningfulTokens.length === 0) {
      this.logger.warn('No meaningful tokens — ranking by vector score only.');
      return [...results]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, topK) as RankedResult[];
    }

    const reranked: RankedResult[] = results.map(result => {
      const docText = (result.payload?.text ?? '').toLowerCase();
      const vectorScore = result.score ?? 0;

      let uniqueTermsMatched = 0;
      for (const token of meaningfulTokens) {
        const escaped = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        // Word boundary matching prevents partial word matching
        if (new RegExp(`\\b${escaped}\\b`, 'gi').test(docText)) {
          uniqueTermsMatched++;
        }
      }

      const coverageBoost = uniqueTermsMatched / meaningfulTokens.length;
      const hybridScore = vectorScore + (this.LAMBDA * coverageBoost);

      return { ...result, score: hybridScore };
    });

    return reranked
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}