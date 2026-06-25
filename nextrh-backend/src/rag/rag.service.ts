import { Injectable } from '@nestjs/common';
import { RetrievalService } from './retrieval/retrieval.service';
import { RerankingService } from './reranking/reranking.service';
import { PromptService } from './prompting/prompt.service';
import { LlmService } from './llm/llm.service';

@Injectable()
export class RagService {
  constructor(
    private retrieval: RetrievalService,
    private rerank: RerankingService,
    private prompt: PromptService,
    private llm: LlmService,
    
  ) {}
/*
  async ask(question: string) {
    const retrieved = await this.retrieval.retrieve(question);
    const reranked = this.rerank.rerank(question, retrieved).slice(0, 5);

    const prompt = this.prompt.build(question, reranked);
    const answer = await this.llm.generate(prompt);
 const evaluation = this.evalu.evaluate(
    question,
    answer,
    reranked,
  );

  return {
    answer,
    metrics: evaluation,
    sources: reranked.map(r => r.payload),
  };
  }*/
 async ask(question: string) {
  const retrieved = await this.retrieval.retrieve(question);

  const reranked = this.rerank
    .rerank(question, retrieved)
    .slice(0, 5);

  const prompt = this.prompt.build(question, reranked);

  const answer = await this.llm.generate(prompt);

  return {
    answer,
    sources: reranked.map(r => r.payload),
  };
}

}