import { Inject, Injectable, Logger } from '@nestjs/common';
import { CertificationSchema } from './certification.schema';
import { ILlmEngine, LLM_ENGINE } from '../llm/llm.interface';



export interface ExtractedCertificate {
  certificate_name?: string;
  provider?: string;
  date_of_obtention?: string | null;
  date_of_expiration?: string | null;
  error?: string;
}
@Injectable()
export class LlmService {
 // private model;
private readonly logger = new Logger(LlmService.name);
constructor(
    @Inject(LLM_ENGINE) private readonly llmEngine: ILlmEngine,
  ) {}  


  async extractCertificate(fullText: string) : Promise<ExtractedCertificate>{
    const prompt = `
Extract certificate data from this text.

Rules:

- Use exact certificate names from the text
- Do NOT invent anything
- Keep provider and dates as-is
- If missing, return null

Return structured output only.

Text:

"""

${fullText}

"""

`;
    try {
    
      const result = await this.llmEngine.generateStructured(
        prompt, 
        CertificationSchema, 
        {
          model: 'qwen2.5:7b', 
          temperature: 0,      
        }
      );
      console.log('✔ Structured output:', result);
      return result;
    } catch (error) {
      console.error('❌ LLM error:', error);
      return {
        error: 'Structured extraction failed',

      };

    }

  }
}
