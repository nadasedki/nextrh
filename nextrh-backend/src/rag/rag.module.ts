import { forwardRef, Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { EmbeddingService } from './embedding/embedding.service';
import { VectorService } from './vector/vector.service';
import { ChunkingService } from './chunking/chunking.service';
import { PromptService } from './prompting/prompt.service';
import { LlmService } from './llm/llm.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { RagPipelineService } from './application/rag-pipeline.service'; 
import { RagOrchestratorService } from './application/rag-orchestrator.service'; 
import { IndexingService } from './indexing/indexing.service';
import { EvaluationService } from './evaluation/evaluation.service';
import { QueryPreprocessorService } from './retrieval/query-preprocessor.service';
import { EmployeesModule } from 'src/Employee/EmployeesModule';
import { IndexingEventListener } from './indexing/indexing-event.listener';
import { VectorMappingRepository } from './indexing/vector-mapping.repository';
import { EvaluationController } from './evaluation/evaluation.controller';
import { BullMQAdapter } from '@bull-board/api/dist/queueAdapters/bullMQ.js';
import { BullBoardModule } from '@bull-board/nestjs/dist/bull-board.module';
import { BullModule } from '@nestjs/bullmq';
import { VectorIndexingProcessor } from './indexing/processors/vector-indexing.processor';

@Module({
imports:[ BullModule.registerQueue({
      name: 'vector-indexing',
    }),

   
    BullBoardModule.forFeature({
      name: 'vector-indexing',
      adapter: BullMQAdapter,
    }),EmployeesModule],
  controllers: [RagController,EvaluationController],
  providers: [
    EmbeddingService,
    VectorService,
    ChunkingService,
    PromptService,
    LlmService,
    RetrievalService,
  
    VectorIndexingProcessor,
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