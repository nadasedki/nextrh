import { forwardRef, Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { EmbeddingService } from './embedding/embedding.service';
import { VectorService } from './vector/vector.service';
import { ChunkingService } from './chunking/chunking.service';
import { PromptService } from './prompting/prompt.service';
import { LlmService } from './llm/llm.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { RerankingService } from './reranking/reranking.service';
import { CvService } from './cv.service';
import { RagPipelineService } from './application/rag-pipeline.service'; // Depends on Retrieval, Rerank, Prompt, LLM
import { RagOrchestratorService } from './application/rag-orchestrator.service'; // Depends on Pipeline
import { IndexingService } from './indexing/indexing.service';
import { EvaluationService } from './evaluation/evaluation.service';
import { QueryPreprocessorService } from './retrieval/query-preprocessor.service';
import { EmployeesModule } from 'src/Employee/EmployeesModule';
import { IndexingEventListener } from './indexing/indexing-event.listener';
import { VectorMappingRepository } from './indexing/vector-mapping.repository';
import { EvaluationController } from './evaluation/evaluation.controller';

@Module({
imports:[ EmployeesModule],
  controllers: [RagController,EvaluationController],
  providers: [
    EmbeddingService,
    VectorService,
    ChunkingService,
    PromptService,
    LlmService,
    RetrievalService,
    RerankingService,
    CvService,
    RagPipelineService,
    RagOrchestratorService,
    IndexingService,
    IndexingEventListener,     
    VectorMappingRepository,
    QueryPreprocessorService,
    EvaluationService,
    
  ],
  exports: [],
})
export class RagModule {}