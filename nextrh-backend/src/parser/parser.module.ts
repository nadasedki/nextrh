import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';
import { AiService } from './ai.service';
import { LlmService } from './llm.service';
@Module({
    providers: [ParserService,AiService, LlmService],
  controllers: [ParserController],
  exports: [AiService,ParserService],
})
export class ParserModule {}
