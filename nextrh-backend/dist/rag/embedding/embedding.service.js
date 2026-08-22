"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmbeddingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const embeddings_1 = require("@langchain/core/embeddings");
const llm_interface_1 = require("../../llm/llm.interface");
let EmbeddingService = EmbeddingService_1 = class EmbeddingService {
    constructor(embeddingModel, configService) {
        this.embeddingModel = embeddingModel;
        this.configService = configService;
        this.logger = new common_1.Logger(EmbeddingService_1.name);
        this.MAX_CHARS = 3000;
        this.MAX_RETRIES = this.configService.get('EMBEDDING_MAX_RETRIES', 5);
        this.BASE_RETRY_DELAY_MS = this.configService.get('EMBEDDING_RETRY_DELAY_MS', 10000);
        this.logger.log(`EmbeddingService initialized with Max Retries: ${this.MAX_RETRIES}`);
    }
    async embed(text) {
        if (!text || text.trim().length === 0) {
            return [];
        }
        const cleanText = text.replace(/[\x00-\x1F\x7F]/g, '').slice(0, this.MAX_CHARS);
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const embedding = await this.embeddingModel.embedQuery(cleanText);
                if (!embedding || !Array.isArray(embedding)) {
                    throw new Error('Embedding engine returned an invalid coordinate structure.');
                }
                return embedding;
            }
            catch (err) {
                const isRateLimit = this.isRateLimitError(err);
                const isLastAttempt = attempt === this.MAX_RETRIES;
                if (isRateLimit && !isLastAttempt) {
                    const retryAfterMs = this.extractRetryAfterMs(err) ?? this.BASE_RETRY_DELAY_MS;
                    this.logger.warn(`Embedding rate limit hit (attempt ${attempt}/${this.MAX_RETRIES}). ` +
                        `Waiting ${retryAfterMs}ms before retry...`);
                    await this.sleep(retryAfterMs);
                    continue;
                }
                if (!isLastAttempt && !isRateLimit) {
                    this.logger.warn(`Embedding failed (attempt ${attempt}/${this.MAX_RETRIES}): ${err.message}. Retrying...`);
                    await this.sleep(this.BASE_RETRY_DELAY_MS);
                    continue;
                }
                this.logger.error(`Text vectorization critical failure: ${err.message}`);
                throw new common_1.ServiceUnavailableException('The underlying language embedding service failed to process the text array context.');
            }
        }
        throw new common_1.ServiceUnavailableException('Embedding failed after all retries.');
    }
    isRateLimitError(err) {
        return err?.message?.includes('429') || err?.message?.includes('Too Many Requests');
    }
    extractRetryAfterMs(err) {
        try {
            const message = err?.message ?? '';
            const match = message.match(/"retryDelay"\s*:\s*"([\d.]+)s"/);
            if (match) {
                return Math.ceil(parseFloat(match[1]) * 1000) + 500;
            }
        }
        catch {
        }
        return null;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.EmbeddingService = EmbeddingService;
exports.EmbeddingService = EmbeddingService = EmbeddingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_interface_1.EMBEDDING_ENGINE)),
    __metadata("design:paramtypes", [embeddings_1.Embeddings,
        config_1.ConfigService])
], EmbeddingService);
//# sourceMappingURL=embedding.service.js.map