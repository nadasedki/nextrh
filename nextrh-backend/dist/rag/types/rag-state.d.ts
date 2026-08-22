import { VectorSearchResult, RankedResult, RagStructuredOutput } from './rag-types';
export interface RagState {
    question: string;
    retrieved: VectorSearchResult[];
    reranked: RankedResult[];
    prompt?: string;
    answer?: string;
    structuredAnswer?: RagStructuredOutput;
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
