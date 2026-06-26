// src/rag/application/rag-pipeline.service.ts
import { Injectable } from '@nestjs/common';
import { RetrievalService } from '../retrieval/retrieval.service';
import { RerankingService } from '../reranking/reranking.service';
import { PromptService } from '../prompting/prompt.service';
import { LlmService } from '../llm/llm.service';
import { RagState } from '../types/rag-state';

@Injectable()
export class RagPipelineService {
  // Les injections se font de manière standard et directe
  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly rerankingService: RerankingService,
    private readonly promptService: PromptService,
    private readonly llmService: LlmService,
  ) {}

  async run(question: string) {
    const state: RagState = {
      question,
      retrieved: [],
      reranked: [],
    };

    // 1. Récupération (Retrieval)
    state.retrieved = await this.retrievalService.retrieve(question);

    // 2. Re-classement (Reranking)
    state.reranked = this.rerankingService
      .rerank(question, state.retrieved)
      .slice(0, 5);

    // 3. Construction du Prompt
    state.prompt = this.promptService.build(question, state.reranked);

    // 4. Génération de la réponse par le LLM
    state.answer = await this.llmService.generate(state.prompt);

    return {
      answer: state.answer,
      sources: state.reranked.map(r => r.payload),
    };
  }
}