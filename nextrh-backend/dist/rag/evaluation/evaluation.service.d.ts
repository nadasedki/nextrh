import { RagPipelineService } from '../application/rag-pipeline.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { RagEvaluationInput, RagEvaluationResult, RagGroundTruthCase, EvaluationReport } from '../types/evaluation.types';
export declare class EvaluationService {
    private readonly pipeline;
    private readonly embeddingService;
    private readonly logger;
    readonly ROUGE_SUCCESS_THRESHOLD = 0.5;
    readonly FAITHFULNESS_SUCCESS_THRESHOLD = 0.7;
    readonly SEMANTIC_SUCCESS_THRESHOLD = 0.75;
    readonly GROUND_TRUTH_PATH: string;
    private readonly OUTPUT_PATH;
    constructor(pipeline: RagPipelineService, embeddingService: EmbeddingService);
    getTestCase(index: number): RagGroundTruthCase | null;
    getAllTestCases(): RagGroundTruthCase[];
    runEvaluationSuite(): Promise<EvaluationReport>;
    evaluate(input: RagEvaluationInput, textForFaithfulness?: string, precomputedExpectedVec?: number[]): Promise<RagEvaluationResult>;
    private calculateCosineSimilarity;
    private calculatePrecisionAtK;
    private calculateRecallAtK;
    private calculateMRR;
    calculateRougeL(referenceText: string, generatedText: string): number;
    private calculateFaithfulness;
    private getLcsLength;
    private tokenizeAndNormalize;
}
