// src/rag/types/rag-state.ts

import { VectorSearchResult, RankedResult,RagStructuredOutput } from './rag-types';


// internal state that flows through the pipeline — never returned directly to the API
export interface RagState {
  question: string;

  // filled by RetrievalService
  retrieved: VectorSearchResult[];

  // filled by RerankingService
  reranked: RankedResult[];

  // filled by PromptService
  prompt?: string;

  // raw JSON string of the structured answer
  answer?: string;

  // parsed structured output — used by orchestrator to shape the API response
  structuredAnswer?: RagStructuredOutput;

  // filled incrementally by RagPipelineService after each stage
  metadata: {
    retrievalTimeMs: number;
    rerankTimeMs: number;
    promptBuildTimeMs: number;
    llmTimeMs: number;
    totalTimeMs: number;
    retrievedCount: number;
    rerankedCount: number;
  };
}