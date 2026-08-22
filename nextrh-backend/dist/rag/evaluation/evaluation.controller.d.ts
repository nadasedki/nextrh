import { EvaluationService } from './evaluation.service';
import { RagPipelineService } from '../application/rag-pipeline.service';
export declare class EvaluationController {
    private readonly evaluationService;
    private readonly pipelineService;
    private readonly logger;
    private readonly INDIVIDUAL_RUNS_PATH;
    private readonly GLOBAL_REPORT_PATH;
    constructor(evaluationService: EvaluationService, pipelineService: RagPipelineService);
    runSingleEvaluation(testCaseIndex: number): Promise<{
        message: string;
        currentRun: {
            testCaseIndex: number;
            query: string;
            category: string;
            expected_answer: string;
            generated_answer: string;
            reasoning: string;
            explanation: string;
            confidence: number;
            retrieved_doc_ids: string[];
            metrics: import("../types/evaluation.types").RagEvaluationResult;
            evaluatedAt: string;
        };
        globalSummary: {
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
    }>;
}
