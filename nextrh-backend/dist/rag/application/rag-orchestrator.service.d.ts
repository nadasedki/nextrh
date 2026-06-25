import { RagPipelineService } from "./rag-pipeline.service";
export declare class RagOrchestratorService {
    private pipeline;
    constructor(pipeline: RagPipelineService);
    ask(question: string): Promise<{
        answer: string;
        sources: any[];
    }>;
}
