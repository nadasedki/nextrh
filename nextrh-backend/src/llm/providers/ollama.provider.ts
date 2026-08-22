import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOllama } from '@langchain/ollama';
import { ILlmEngine, LlmDocumentAttachment, LlmOptions } from '../llm.interface';

export class OllamaProvider implements ILlmEngine {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly model: ChatOllama;

// src/llm/providers/ollama.provider.ts

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL', 'http://127.0.0.1:11434');
    const modelName = this.configService.get<string>('OLLAMA_MODEL', 'qwen2.5:7b');

    // FIX: Force explicit number conversions to prevent string-to-number leaks
    const temperature = Number(this.configService.get('OLLAMA_TEMPERATURE') ?? 0);
    const numCtx = Number(this.configService.get('OLLAMA_NUM_CTX') ?? 16384);
    const numPredict = Number(this.configService.get('OLLAMA_NUM_PREDICT') ?? 2048);

    this.model = new ChatOllama({
      baseUrl,
      model: modelName,
      temperature,
      numCtx,
      numPredict, 
    });

    this.logger.log(
      `OllamaProvider initialized — model: ${modelName}, temp: ${temperature}, numCtx: ${numCtx}, numPredict: ${numPredict}`,
    );
  }

   /**
   * Helper to build a model instance, dynamically applying any caller-provided overrides [2]
   */
  private getModelInstance(options?: LlmOptions): ChatOllama {
    if (!options) {
      return this.model; // Fallback to default .env config [1]
    }

    // Return a temporary model with overridden options [2]
    return new ChatOllama({
      baseUrl: this.configService.get<string>('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
      model: options.model || this.configService.get<string>('OLLAMA_CV_MODEL', 'qwen2.5:7b'),
      temperature: options.temperature !== undefined ? options.temperature : 0,
      numCtx: options.numCtx || 16384,
      numPredict: options.numPredict || 2048,
    });
  }
 async generate(prompt: string, options?: LlmOptions): Promise<string> {
    try {
      const activeModel = this.getModelInstance(options); 
      const response = await activeModel.invoke(prompt);
      return response.content as string;
    } catch (err: any) {
      this.logger.error(`Ollama generate failed: ${err.message}`);
      throw err;
    }
  }

  async generateStructured<T>(prompt: string, schema: object, options?: LlmOptions, attachment?: LlmDocumentAttachment,): Promise<T> {
    try {
      const activeModel = this.getModelInstance(options);
      const structured = activeModel.withStructuredOutput(schema as any);
      const response   = await structured.invoke(prompt);
      return response as T;
    } catch (err: any) {
      this.logger.error(`Ollama generateStructured failed: ${err.message}`);
      throw err;
    }
  }
}