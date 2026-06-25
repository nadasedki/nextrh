import { RagPipelineService } from '../application/rag-pipeline.service';
export interface RagEvaluationInput {
    query: string;
    expectedDocIds: string[];
    retrievedDocIds: string[];
    expectedAnswer: string;
    generatedAnswer: string;
    retrievedContextText: string;
}
export interface RagEvaluationResult {
    precisionAtK: number;
    recallAtK: number;
    mrr: number;
    rougeLScore: number;
    faithfulnessScore: number;
    success: boolean;
}
export declare class EvaluationService {
    private readonly pipeline;
    private readonly logger;
    private readonly ROUGE_SUCCESS_THRESHOLD;
    private readonly FAITHFULNESS_SUCCESS_THRESHOLD;
    constructor(pipeline: RagPipelineService);
    runEvaluationSuite(): Promise<any>;
    evaluate(input: RagEvaluationInput, k?: number): RagEvaluationResult;
    private calculatePrecisionAtK;
    private calculateRecallAtK;
    private calculateMRR;
    calculateRougeL(referenceText: string, generatedText: string): number;
    private calculateFaithfulness;
    private getLcsLength;
    private tokenizeAndNormalize;
}
