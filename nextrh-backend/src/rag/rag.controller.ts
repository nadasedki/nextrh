import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { IndexingService } from './indexing/indexing.service';
import { RagOrchestratorService } from './application/rag-orchestrator.service';
import { EvaluationService } from './evaluation/evaluation.service';
@Controller('rag')
export class RagController {
 constructor(
    private readonly ragOrchestrator: RagOrchestratorService,
    private readonly indexingService: IndexingService,
    private readonly evaluationService: EvaluationService,
  
  ) {}

  @Post('ask')
  async ask(
    @Body() body: { question: string },
  ) {
    return this.ragOrchestrator.ask(body.question);
  }

  @Post('index-all')
  async indexAll() {
    return this.indexingService.indexAllCVs();
  }
  @Post('evaluate')
  async evaluate() {
    return this.evaluationService.runEvaluationSuite();
  }

  
  /* constructor(
    private readonly ragService: RagService,
    private readonly indexingService: IndexingService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorService: VectorService,
  ) {}

  // ======================================================
  // 🧪 TEST 1: Embedding check
  // ======================================================
  @Get('test-embed')
  async testEmbed(@Query('text') text: string) {
    return {
      input: text,
      vector: await this.embeddingService.embed(text || 'Hello world'),
    };
  }

  // ======================================================
  // 🧪 TEST 2: Qdrant search (low-level test)
  // ======================================================
  @Get('test-search')
  async testSearch(@Query('text') text: string) {
    const vector = await this.embeddingService.embed(text || 'test');

    const results = await this.vectorService.search(vector, 5);

    return {
      query: text,
      results,
    };
  }

 
  // ======================================================
  // 📥 INDEX ALL CVs (FULL PIPELINE)
  // ======================================================
  @Post('index-all')
  async indexAll() {
    const total = await this.indexingService.indexAllCVs();

    return {
      message: 'All CVs indexed',
      totalIndexed: total,
    };
  }

  // ======================================================
  // ❓ MAIN RAG ENDPOINT (CHAT)
  // ======================================================
 @Post('ask')
  async ask(@Body('question') question: string) {
    if (!question) {
      return {
        error: 'Question is required',
      };
    }

    const answer = await this.ragService.ask(question);

    return {
      question,
      answer,
    };
  }

  // ======================================================
  // 🔍 SIMPLE RETRIEVAL ONLY (no LLM)
  // ======================================================
  @Get('retrieve')
  async retrieve(@Query('q') question: string) {
    const vector = await this.embeddingService.embed(question);

    const results = await this.vectorService.search(vector, 10);

    return {
      question,
      results,
    };
  }*/
}