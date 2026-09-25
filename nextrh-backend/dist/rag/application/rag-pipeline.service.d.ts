import { RetrievalService } from '../retrieval/retrieval.service';
import { PromptService } from '../prompting/prompt.service';
import { LlmService } from '../llm/llm.service';
import { RagState } from '../types/rag-state';
export declare class RagPipelineService {
    private readonly retrievalService;
    private readonly promptService;
    private readonly llmService;
    private readonly logger;
    constructor(retrievalService: RetrievalService, promptService: PromptService, llmService: LlmService);
    run(question: string): Promise<RagState>;
    runWithoutReranking(question: string): Promise<RagState>;
}
