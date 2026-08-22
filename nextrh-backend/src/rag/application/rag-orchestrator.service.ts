// src/rag/application/rag-orchestrator.service.ts

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RagPipelineService } from './rag-pipeline.service';
import { RagResponse, SourceReference } from '../types/rag-types';

@Injectable()
export class RagOrchestratorService {
  private readonly logger = new Logger(RagOrchestratorService.name);

  constructor(private readonly pipeline: RagPipelineService) {}

  async ask(question: string): Promise<RagResponse> {
    if (!question || question.trim().length === 0) {
      throw new BadRequestException('Question cannot be empty.');
    }

    if (question.trim().length < 3) {
      throw new BadRequestException('Question is too short.');
    }

    this.logger.log(`Incoming RAG query: "${question.trim()}"`);

    const state = await this.pipeline.run(question.trim());

    const sources: SourceReference[] = state.reranked.map(r => ({
      text:      r.payload?.text,
      type:      r.payload?.type,
      candidate: r.payload?.full_name,
      user_id:     r.payload?.user_id,
      score:     r.score,
    }));

    // use structured fields if available, fall back to raw answer string
    const structured = state.structuredAnswer;

    return {
      // structured fields exposed individually for frontend consumption
      answer:      structured?.answer      ?? state.answer ?? '',
      reasoning:   structured?.reasoning ?? '',
      explanation: structured?.explanation ?? '',
      confidence:  structured?.confidence  ?? 0,
      llmSources:  structured?.sources     ?? [],
      // retrieval sources from Qdrant
      sources,
      metrics: state.metadata,
    };
  }
}