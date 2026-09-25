import { Injectable, Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';
import { RetrievalService } from '../retrieval/retrieval.service';
import { PromptService } from '../prompting/prompt.service';
import { LlmService } from '../llm/llm.service';
import { RagState } from '../types/rag-state';
import { RankedResult } from '../types/rag-types';

@Injectable()
export class RagPipelineService {
  private readonly logger = new Logger(RagPipelineService.name);

  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly promptService: PromptService,
    private readonly llmService: LlmService,
  ) {}

  async run(question: string): Promise<RagState> {
    const pipelineStart = performance.now();

    const state: RagState = {
      question,
      retrieved: [],
      reranked: [],
      metadata: {
        retrievalTimeMs: 0,
        rerankTimeMs: 0,
        promptBuildTimeMs: 0,
        llmTimeMs: 0,
        totalTimeMs: 0,
        retrievedCount: 0,
        rerankedCount: 0,
      },
    };

    const retrievalStart = performance.now();
    state.retrieved = await this.retrievalService.retrieve(question);
    state.metadata.retrievalTimeMs = Math.round(performance.now() - retrievalStart);
    state.metadata.retrievedCount = state.retrieved.length;
    this.logger.log(
      `Retrieval done: ${state.retrieved.length} candidates in ${state.metadata.retrievalTimeMs}ms`,
    );

  
  state.reranked = state.retrieved.slice(0, 8) as RankedResult[];
    state.metadata.rerankedCount = state.reranked.length;
    state.metadata.rerankTimeMs = 0;
    this.logger.log(
      `Reranking Bypassed: Selected top ${state.reranked.length} .`,
    );
    const promptStart = performance.now();
    state.prompt = this.promptService.build(question, state.reranked);
    state.metadata.promptBuildTimeMs = Math.round(performance.now() - promptStart);
    this.logger.log(`Prompt built in ${state.metadata.promptBuildTimeMs}ms`);

     const llmStart = performance.now();
    const structured = await this.llmService.generate(
      state.prompt,
      this.promptService.OUTPUT_SCHEMA,
    );
    state.metadata.llmTimeMs = Math.round(performance.now() - llmStart);
    this.logger.log(`LLM generation done in ${state.metadata.llmTimeMs}ms`);

    state.answer = JSON.stringify(structured);
    state.structuredAnswer = structured;

    state.metadata.totalTimeMs = Math.round(performance.now() - pipelineStart);
    this.logger.log(
      `Pipeline complete in ${state.metadata.totalTimeMs}ms ` +
      `(retrieval: ${state.metadata.retrievalTimeMs}ms, ` +
      `rerank: ${state.metadata.rerankTimeMs}ms, ` +
      `prompt: ${state.metadata.promptBuildTimeMs}ms, ` +
      `llm: ${state.metadata.llmTimeMs}ms)`,
    );

    return state;
  }

  // bypass reranker — used for ablation study only
async runWithoutReranking(question: string): Promise<RagState> {
  const state: RagState = {
    question,
    retrieved: [],
    reranked: [],
    metadata: {
      retrievalTimeMs: 0, rerankTimeMs: 0,
      promptBuildTimeMs: 0, llmTimeMs: 0,
      totalTimeMs: 0, retrievedCount: 0, rerankedCount: 0,
    },
  };

  state.retrieved = await this.retrievalService.retrieve(question);
   state.reranked = state.retrieved.slice(0, 5) as RankedResult[];
  state.prompt = this.promptService.build(question, state.reranked);
  const structured = await this.llmService.generate(
    state.prompt,
    this.promptService.OUTPUT_SCHEMA,
  );
  state.structuredAnswer = structured;
  state.answer = JSON.stringify(structured);
  return state;
}
}