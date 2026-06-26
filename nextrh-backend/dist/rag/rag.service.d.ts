import { RetrievalService } from './retrieval/retrieval.service';
import { RerankingService } from './reranking/reranking.service';
import { PromptService } from './prompting/prompt.service';
import { LlmService } from './llm/llm.service';
export declare class RagService {
    private retrieval;
    private rerank;
    private prompt;
    private llm;
    constructor(retrieval: RetrievalService, rerank: RerankingService, prompt: PromptService, llm: LlmService);
    ask(question: string): Promise<{
        answer: string;
        sources: any[];
    }>;
}
