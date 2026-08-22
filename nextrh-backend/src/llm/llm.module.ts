import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLM_ENGINE ,EMBEDDING_ENGINE } from './llm.interface';
import { createEmbeddingEngine, createLlmEngine } from './llm.factory';


@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide:    LLM_ENGINE,
      inject:     [ConfigService],
      useFactory: (configService: ConfigService) => createLlmEngine(configService),
    },
      {
      provide:    EMBEDDING_ENGINE, 
      inject:     [ConfigService],
      useFactory: (configService: ConfigService) => createEmbeddingEngine(configService), 
    },
  ],
  
  exports: [LLM_ENGINE, EMBEDDING_ENGINE],
})
export class LlmModule {}