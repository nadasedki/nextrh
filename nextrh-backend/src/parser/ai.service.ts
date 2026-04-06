import { Injectable } from '@nestjs/common';
import { ParserService } from './parser.service';
import { LlmService } from './llm.service';

@Injectable()
export class AiService {
  constructor(
    private readonly ParserService: ParserService,
    private readonly llmService: LlmService,
  ) {}

  async extractCertificate(filePath: string) {
    //  OCR
    const text = await this.ParserService.extractTextFromPdf(filePath);

    //  LLM
    const data = await this.llmService.extractCertificate(text);
    
    
    return data; // Return the first (and should be only) certification object
  }
}