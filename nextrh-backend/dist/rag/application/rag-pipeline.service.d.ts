import { RetrievalService } from '../retrieval/retrieval.service';
import { RerankingService } from '../reranking/reranking.service';
import { PromptService } from '../prompting/prompt.service';
import { LlmService } from '../llm/llm.service';
export declare class RagPipelineService {
    private readonly retrievalService;
    private readonly rerankingService;
    private readonly promptService;
    private readonly llmService;
    constructor(retrievalService: RetrievalService, rerankingService: RerankingService, promptService: PromptService, llmService: LlmService);
    run(question: string): Promise<{
        answer: string;
        sources: any[];
    }>;
}
