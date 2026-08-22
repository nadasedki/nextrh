export interface RagEvaluationInput {
    query: string;
    expectedDocIds: string[];
    retrievedDocIds: string[];
    expectedAnswer: string;
    generatedAnswer: string;
    retrievedContextText: string;
}
export interface RagEvaluationResult {
    precisionAt3: number;
    recallAt3: number;
    precisionAt5: number;
    recallAt5: number;
    mrr: number;
    rougeLScore: number;
    faithfulnessScore: number;
    semanticSimilarityScore: number;
    success: boolean;
}
export interface EvaluationDetailEntry {
    query: string;
    category: string;
    metrics: RagEvaluationResult;
    generated_answer: string | undefined;
    expected_answer: string;
    retrieved_sources_ids: string[];
}
export interface RagGroundTruthCase {
    query: string;
    category: string;
    expected_doc_ids: string[];
    expected_answer: string;
}
export interface EvaluationReport {
    evaluatedAt: string;
    successCriteria: {
        faithfulnessThreshold: number;
        rougeLThreshold: number;
        semanticThreshold: number;
        logic: string;
    };
    summary: {
        totalQueriesEvaluated: number;
        globalPrecisionAt3: number;
        globalRecallAt3: number;
        globalPrecisionAt5: number;
        globalRecallAt5: number;
        globalMRR: number;
        globalRougeLScore: number;
        globalFaithfulness: number;
        globalSemanticSimilarityScore: number;
        globalSuccessRate: number;
    };
    ablation: {
        mrrWithReranking: number;
        mrrWithoutReranking: number;
        mrrImprovement: number;
        precisionAt3WithReranking: number;
        precisionAt3WithoutReranking: number;
        precisionAt3Improvement: number;
    };
    categoryBreakdown: Record<string, {
        count: number;
        avgMRR: number;
        avgPrecisionAt3: number;
        avgRecallAt3: number;
        avgRougeL: number;
        avgSemanticSimilarity: number;
    }>;
    details: EvaluationDetailEntry[];
}
