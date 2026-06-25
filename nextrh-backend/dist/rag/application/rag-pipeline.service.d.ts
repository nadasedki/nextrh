import { RetrievalService } from "../retrieval/retrieval.service";
import { PromptService } from "../prompting/prompt.service";
import { LlmService } from "../llm/llm.service";
import { RerankingService } from "../reranking/reranking.service";
export declare class RagPipelineService {
    private retrieval;
    private rerank;
    private prompt;
    private llm;
    constructor(retrieval: RetrievalService, rerank: RerankingService, prompt: PromptService, llm: LlmService);
    run(question: string): Promise<{
        answer: string;
        sources: any[];
    }>;
}
