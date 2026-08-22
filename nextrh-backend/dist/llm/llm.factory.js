"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLlmEngine = createLlmEngine;
exports.createEmbeddingEngine = createEmbeddingEngine;
const common_1 = require("@nestjs/common");
const ollama_provider_1 = require("./providers/ollama.provider");
const gemini_provider_1 = require("./providers/gemini.provider");
const ollama_1 = require("@langchain/ollama");
const logger = new common_1.Logger('LlmFactory');
const google_genai_1 = require("@langchain/google-genai");
function createLlmEngine(configService) {
    const provider = configService.get('LLM_PROVIDER', 'ollama').toLowerCase();
    logger.log(`LLM provider selected: "${provider}"`);
    switch (provider) {
        case 'ollama':
            return new ollama_provider_1.OllamaProvider(configService);
        case 'gemini':
            return new gemini_provider_1.GeminiProvider(configService);
        default:
            logger.warn(`Unknown LLM_PROVIDER "${provider}" — falling back to Ollama. ` +
                `Valid values: ollama, gemini, openai`);
            return new ollama_provider_1.OllamaProvider(configService);
    }
}
function createEmbeddingEngine(configService) {
    const provider = configService.get('EMBEDDING_PROVIDER', 'ollama').toLowerCase();
    logger.log(`LLM Embedding provider selected: "${provider}"`);
    switch (provider) {
        case 'gemini':
            return new google_genai_1.GoogleGenerativeAIEmbeddings({
                apiKey: configService.get('GEMINI_API_KEY'),
                model: 'gemini-embedding-001',
            });
        case 'ollama':
        default:
            return new ollama_1.OllamaEmbeddings({
                baseUrl: configService.get('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
                model: configService.get('OLLAMA_EMBEDDING_MODEL', 'bge-m3'),
            });
    }
}
//# sourceMappingURL=llm.factory.js.map