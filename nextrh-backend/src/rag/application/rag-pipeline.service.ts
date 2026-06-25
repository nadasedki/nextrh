import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { RetrievalService } from "../retrieval/retrieval.service";
import { PromptService } from "../prompting/prompt.service";
import { RagState } from "../types/rag-state";
import { LlmService } from "../llm/llm.service";
import { RerankingService } from "../reranking/reranking.service";

@Injectable()
export class RagPipelineService {
 constructor(
    @Inject(forwardRef(() => RetrievalService))
    private retrieval: RetrievalService,
    
    @Inject(forwardRef(() => RerankingService))
    private rerank: RerankingService,
    
    @Inject(forwardRef(() => PromptService))
    private prompt: PromptService,
    
    @Inject(forwardRef(() => LlmService))
    private llm: LlmService,
  ) {}

  async run(question: string) {
    const state: RagState = {
      question,
      retrieved: [],
      reranked: [],
    };

    // 1. Retrieval
    state.retrieved = await this.retrieval.retrieve(question);

    // 2. Reranking
    state.reranked = this.rerank
      .rerank(question, state.retrieved)
      .slice(0, 5);

    // 3. Prompt
    state.prompt = this.prompt.build(question, state.reranked);

    // 4. LLM
    state.answer = await this.llm.generate(state.prompt);

    return {
      answer: state.answer,
      sources: state.reranked.map(r => r.payload),
    };
  }
}