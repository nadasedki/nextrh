// src/rag/types/rag-types.ts

/**
 * The payload stored alongside each vector point in Qdrant.
 * Extracted using native numeric IDs mapped directly from our SQL database.
 */
export interface QdrantPayload {
  text?: string;
  type?: string;
  user_id?: number;      // ⚡ Added to track candidate ownership uniformly
  entity_id?: number;
  full_name?: string;
  source_table?: string;
  indexed_at?: string;
}

/**
 * A single result returned by Qdrant vector search.
 * id is now natively a 64-bit integer (u64 primitive number).
 * score is the cosine similarity value in range [0, 1].
 */
export interface VectorSearchResult {
  id: number; // ⚡ Fixed strictly to number for native Qdrant u64 speed optimizations
  score: number;
  payload: QdrantPayload;
}

/**
 * A reranked result after hybrid scoring.
 * score is overwritten by your Cross-Encoder/hybrid formula.
 */
export interface RankedResult extends VectorSearchResult {
  score: number;
}

/**
 * A single source reference returned to the API caller.
 */
export interface SourceReference {
  text: string | undefined;
  type: string | undefined;
  candidate: string | undefined;
  //cv_id: number | undefined;
  user_id: number | undefined;
  score: number;
}

/**
 * High-fidelity telemetry metrics capturing pipeline performance.
 */
export interface RagMetrics {
  retrievalTimeMs: number;
  rerankTimeMs: number;
  promptBuildTimeMs: number;
  llmTimeMs: number;
  totalTimeMs: number;
  retrievedCount: number;
  rerankedCount: number;
}

// add to existing RagResponse interface in rag-types.ts

export interface RagResponse {
  answer: string;
  reasoning: string;       // evaluation_and_reasoning from structured output
  explanation: string;     // one-sentence summary
  confidence: number;      // 0 to 1
  llmSources: string[];    // sources cited by the LLM
  sources: SourceReference[];  // retrieval sources from Qdrant
  metrics: {
    retrievalTimeMs: number;
    rerankTimeMs: number;
    promptBuildTimeMs: number;
    llmTimeMs: number;
    totalTimeMs: number;
    retrievedCount: number;
    rerankedCount: number;
  };
  
}

// shape of the structured response the LLM must return
export interface RagStructuredOutput {
  reasoning: string;
  answer: string;
  explanation: string;
  confidence: number;
  sources: string[];
}