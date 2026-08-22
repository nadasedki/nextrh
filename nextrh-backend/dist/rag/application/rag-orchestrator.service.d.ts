import { RagPipelineService } from './rag-pipeline.service';
import { RagResponse } from '../types/rag-types';
export declare class RagOrchestratorService {
    private readonly pipeline;
    private readonly logger;
    constructor(pipeline: RagPipelineService);
    ask(question: string): Promise<RagResponse>;
}
