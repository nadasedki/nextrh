import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { ParserService } from '../../parser/parser.service' // Adjust path to your actual ParserService
import { LlmService } from '../../parser/llm.service';       // Adjust path to your actual LlmService

@Module({
  providers: [EvaluationService, ParserService, LlmService],
  exports: [EvaluationService],
})
export class EvaluationModule {}