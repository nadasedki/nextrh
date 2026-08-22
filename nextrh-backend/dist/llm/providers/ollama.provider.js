"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const common_1 = require("@nestjs/common");
const ollama_1 = require("@langchain/ollama");
class OllamaProvider {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(OllamaProvider.name);
        const baseUrl = this.configService.get('OLLAMA_BASE_URL', 'http://127.0.0.1:11434');
        const modelName = this.configService.get('OLLAMA_MODEL', 'qwen2.5:7b');
        const temperature = Number(this.configService.get('OLLAMA_TEMPERATURE') ?? 0);
        const numCtx = Number(this.configService.get('OLLAMA_NUM_CTX') ?? 16384);
        const numPredict = Number(this.configService.get('OLLAMA_NUM_PREDICT') ?? 2048);
        this.model = new ollama_1.ChatOllama({
            baseUrl,
            model: modelName,
            temperature,
            numCtx,
            numPredict,
        });
        this.logger.log(`OllamaProvider initialized — model: ${modelName}, temp: ${temperature}, numCtx: ${numCtx}, numPredict: ${numPredict}`);
    }
    getModelInstance(options) {
        if (!options) {
            return this.model;
        }
        return new ollama_1.ChatOllama({
            baseUrl: this.configService.get('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
            model: options.model || this.configService.get('OLLAMA_CV_MODEL', 'qwen2.5:7b'),
            temperature: options.temperature !== undefined ? options.temperature : 0,
            numCtx: options.numCtx || 16384,
            numPredict: options.numPredict || 2048,
        });
    }
    async generate(prompt, options) {
        try {
            const activeModel = this.getModelInstance(options);
            const response = await activeModel.invoke(prompt);
            return response.content;
        }
        catch (err) {
            this.logger.error(`Ollama generate failed: ${err.message}`);
            throw err;
        }
    }
    async generateStructured(prompt, schema, options, attachment) {
        try {
            const activeModel = this.getModelInstance(options);
            const structured = activeModel.withStructuredOutput(schema);
            const response = await structured.invoke(prompt);
            return response;
        }
        catch (err) {
            this.logger.error(`Ollama generateStructured failed: ${err.message}`);
            throw err;
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama.provider.js.map