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
var RetrievalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const vector_service_1 = require("../vector/vector.service");
const embedding_service_1 = require("../embedding/embedding.service");
const query_preprocessor_service_1 = require("./query-preprocessor.service");
let RetrievalService = RetrievalService_1 = class RetrievalService {
    constructor(vector, embed, preprocessor, configService) {
        this.vector = vector;
        this.embed = embed;
        this.preprocessor = preprocessor;
        this.configService = configService;
        this.logger = new common_1.Logger(RetrievalService_1.name);
        this.topK = this.configService.get('RETRIEVAL_TOP_K', 20);
        this.logger.log(`RetrievalService initialized — topK: ${this.topK}`);
    }
    async retrieve(question) {
        const { cleaned, expandedTerms } = this.preprocessor.preprocess(question);
        this.logger.debug(`Original query:     "${question}"`);
        this.logger.debug(`Preprocessed query: "${cleaned}"`);
        if (expandedTerms.length > 0) {
            this.logger.debug(`Expanded terms: [${expandedTerms.join(', ')}]`);
        }
        const qVec = await this.embed.embed(cleaned);
        const raw = await this.vector.search(qVec, this.topK);
        const results = raw.map(hit => ({
            id: Number(hit.id),
            score: hit.score,
            payload: {
                text: hit.payload?.['text'],
                type: hit.payload?.['type'],
                user_id: hit.payload?.['user_id'],
                entity_id: hit.payload?.['entity_id'],
                full_name: hit.payload?.['full_name'],
                source_table: hit.payload?.['source_table'],
                indexed_at: hit.payload?.['indexed_at'],
            },
        }));
        this.logger.log(`Retrieved ${results.length} candidates for: "${question}" ` +
            `(preprocessed: "${cleaned}")`);
        return results;
    }
};
exports.RetrievalService = RetrievalService;
exports.RetrievalService = RetrievalService = RetrievalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vector_service_1.VectorService,
        embedding_service_1.EmbeddingService,
        query_preprocessor_service_1.QueryPreprocessorService,
        config_1.ConfigService])
], RetrievalService);
//# sourceMappingURL=retrieval.service.js.map