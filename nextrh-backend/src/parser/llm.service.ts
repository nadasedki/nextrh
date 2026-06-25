// src/parser/llm.service.ts
import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { CertificationSchema } from './certification.schema';

@Injectable()
export class LlmService {
  private model;

  constructor() {
    this.model = new ChatOllama({
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5:7b',
      temperature: 0,
    }).withStructuredOutput(CertificationSchema);
  }

  async extractCertificate(fullText: string) {
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
      const result = await this.model.invoke(prompt);
      console.log('✔ Structured output:', result);
      return result;
    } catch (error) {
      console.error('❌ LLM error:', error);
      return {
        error: 'Structured extraction failed',

      };

    }

  }
  /*  async extractCertificate(fullText: string) {

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

      const result = await this.model.invoke(prompt);



      console.log('✔ Structured output:', result);



      return result;

    } catch (error) {

      console.error('❌ LLM error:', error);



      return {

        error: 'Structured extraction failed',

      };

    }

  }*/
}