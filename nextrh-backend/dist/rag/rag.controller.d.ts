import { IndexingService } from './indexing/indexing.service';
import { RagOrchestratorService } from './application/rag-orchestrator.service';
import { EvaluationService } from './evaluation/evaluation.service';
import { EvaluationReport } from './types/evaluation.types';
export declare class RagController {
    private readonly ragOrchestrator;
    private readonly indexingService;
    private readonly evaluationService;
    constructor(ragOrchestrator: RagOrchestratorService, indexingService: IndexingService, evaluationService: EvaluationService);
    ask(body: {
        question: string;
    }): Promise<import("./types/rag-types").RagResponse>;
    indexAll(): Promise<import("./indexing/indexing.service").IndexAllResult>;
    evaluate(): Promise<EvaluationReport>;
}
