import { IndexingService } from './indexing/indexing.service';
import { RagOrchestratorService } from './application/rag-orchestrator.service';
import { EvaluationService } from './evaluation/evaluation.service';
export declare class RagController {
    private readonly ragOrchestrator;
    private readonly indexingService;
    private readonly evaluationService;
    constructor(ragOrchestrator: RagOrchestratorService, indexingService: IndexingService, evaluationService: EvaluationService);
    ask(body: {
        question: string;
    }): Promise<{
        answer: string;
        sources: any[];
    }>;
    indexAll(): Promise<{
        totalCVs: number;
        totalPoints: number;
    }>;
    evaluate(): Promise<any>;
}
