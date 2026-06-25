import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';
import { AiService } from './ai.service';
import { LlmService } from './llm.service';
import { EvaluationMetricsService } from './evaluation-metrics.service';
@Module({
  providers: [ParserService,AiService, LlmService, EvaluationMetricsService],
  controllers: [ParserController],
  exports: [AiService,ParserService],
})
export class ParserModule {}
