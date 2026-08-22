export interface QdrantPayload {
    text?: string;
    type?: string;
    user_id?: number;
    entity_id?: number;
    full_name?: string;
    source_table?: string;
    indexed_at?: string;
}
export interface VectorSearchResult {
    id: number;
    score: number;
    payload: QdrantPayload;
}
export interface RankedResult extends VectorSearchResult {
    score: number;
}
export interface SourceReference {
    text: string | undefined;
    type: string | undefined;
    candidate: string | undefined;
    user_id: number | undefined;
    score: number;
}
export interface RagMetrics {
    retrievalTimeMs: number;
    rerankTimeMs: number;
    promptBuildTimeMs: number;
    llmTimeMs: number;
    totalTimeMs: number;
    retrievedCount: number;
    rerankedCount: number;
}
export interface RagResponse {
    answer: string;
    reasoning: string;
    explanation: string;
    confidence: number;
    llmSources: string[];
    sources: SourceReference[];
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
export interface RagStructuredOutput {
    reasoning: string;
    answer: string;
    explanation: string;
    confidence: number;
    sources: string[];
}
