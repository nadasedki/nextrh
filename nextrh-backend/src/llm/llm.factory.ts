import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILlmEngine } from './llm.interface';
import { OllamaProvider } from './providers/ollama.provider';
import { GeminiProvider } from './providers/gemini.provider';
//import { OpenAiProvider } from './providers/openai.provider';
import { OllamaEmbeddings } from '@langchain/ollama';
const logger = new Logger('LlmFactory');
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
/**
 * Factory function — reads LLM_PROVIDER from env and instantiates
 * the matching strategy. Bound to the LLM_ENGINE injection token
 * in LlmModule so all consumers receive the active provider.
 *
 * Switching providers requires only changing LLM_PROVIDER in .env —
 * zero code changes in any consumer module.
 */
export function createLlmEngine(configService: ConfigService): ILlmEngine {
  const provider = configService.get<string>('LLM_PROVIDER', 'ollama').toLowerCase();

  logger.log(`LLM provider selected: "${provider}"`);

  switch (provider) {
    case 'ollama':
      return new OllamaProvider(configService);

    case 'gemini':
      return new GeminiProvider(configService);

    default:
      logger.warn(
        `Unknown LLM_PROVIDER "${provider}" — falling back to Ollama. ` +
        `Valid values: ollama, gemini, openai`,
      );
      return new OllamaProvider(configService);
  }}
/**
 * 2. Factory function to instantiate the correct embedding model based on .env [1, 2]
 */
export function createEmbeddingEngine(configService: ConfigService): any {
  const provider = configService.get<string>('EMBEDDING_PROVIDER', 'ollama').toLowerCase();

  logger.log(`LLM Embedding provider selected: "${provider}"`);

  switch (provider) {
   case 'gemini':
      return new GoogleGenerativeAIEmbeddings({
        apiKey: configService.get<string>('GEMINI_API_KEY'),
        model: 'gemini-embedding-001', 
      });
    case 'ollama':
    default:
      return new OllamaEmbeddings({
        baseUrl: configService.get<string>('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
        model: configService.get<string>('OLLAMA_EMBEDDING_MODEL', 'bge-m3'),
      });
  }
}

