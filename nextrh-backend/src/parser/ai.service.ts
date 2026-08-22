import { Injectable } from '@nestjs/common';
import { ParserService } from './parser.service';
import { LlmService,ExtractedCertificate  } from './llm.service';

@Injectable()
export class AiService {
  constructor(
    private readonly ParserService: ParserService,
    private readonly llmService: LlmService,
  ) {}

  async extractCertificate(filePath: string) {
    //  OCR
    const { text, confidence }  = await this.ParserService.extractTextFromPdf(filePath);

    //  LLM
     const data: ExtractedCertificate = await this.llmService.extractCertificate(text);
    
    // 3. Post-processing : Normalisation des formats de date
    if (data && !data.error) {
      data.date_of_obtention = this.ParserService.formatDateToISO(data.date_of_obtention) || data.date_of_obtention;
      data.date_of_expiration = this.ParserService.formatDateToISO(data.date_of_expiration);
    }
    
    return data; 
    }
   async extractCertificate2(filePath: string) {
    //  OCR
    const { text, confidence } = await this.ParserService.extractTextFromPdf(filePath);

    //  LLM
     const data: ExtractedCertificate = await this.llmService.extractCertificate(text);
    // 3. Post-processing : Normalisation des formats de date
    if (data && !data.error) {
      data.date_of_obtention = this.ParserService.formatDateToISO(data.date_of_obtention) || data.date_of_obtention;
      data.date_of_expiration = this.ParserService.formatDateToISO(data.date_of_expiration);
    }
    
    return {
  ...data,
  ocrText: text ,
  ocrConfidence: confidence,    
}; 
  }
}