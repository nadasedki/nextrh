// src/rag/llm/llm.service.ts
import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { RagStructuredOutput } from '../types/rag-types';
import { ILlmEngine, LLM_ENGINE } from '../../llm/llm.interface'; // Adjust path if needed [2]

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    // 1. Inject your global, switchable LLM engine cleanly [2]
    @Inject(LLM_ENGINE) private readonly llmEngine: ILlmEngine,
  ) {
    this.logger.log('RAG LlmService initialized using global LLM_ENGINE strategy [2].');
  }

  /**
   * Generates a structured JSON response from the LLM.
   * Delegates the call to the active LLM strategy provider, making 
   * this method compatible with both local and cloud models [1, 2].
   */
  async generate(
    prompt: string,
    schema: object,
  ): Promise<RagStructuredOutput> {
    try {
      // 2. Call the unified engine's structured generator [2]
      // No more raw axios, manual JSON parsing, or timeout handling!
      const parsed = await this.llmEngine.generateStructured<RagStructuredOutput>(prompt, schema);
      return parsed;
    } catch (error: any) {
      this.logger.error(`LLM generation failed: ${error.message}`);
      throw new ServiceUnavailableException(
        'The AI inference engine is currently unreachable. Please try again.',
      );
    }
  }
}