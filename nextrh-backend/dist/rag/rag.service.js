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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagService = void 0;
const common_1 = require("@nestjs/common");
const retrieval_service_1 = require("./retrieval/retrieval.service");
const reranking_service_1 = require("./reranking/reranking.service");
const prompt_service_1 = require("./prompting/prompt.service");
const llm_service_1 = require("./llm/llm.service");
let RagService = class RagService {
    constructor(retrieval, rerank, prompt, llm) {
        this.retrieval = retrieval;
        this.rerank = rerank;
        this.prompt = prompt;
        this.llm = llm;
    }
    async ask(question) {
        const retrieved = await this.retrieval.retrieve(question);
        const reranked = this.rerank
            .rerank(question, retrieved)
            .slice(0, 5);
        const prompt = this.prompt.build(question, reranked);
        const answer = await this.llm.generate(prompt);
        return {
            answer,
            sources: reranked.map(r => r.payload),
        };
    }
};
exports.RagService = RagService;
exports.RagService = RagService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [retrieval_service_1.RetrievalService,
        reranking_service_1.RerankingService,
        prompt_service_1.PromptService,
        llm_service_1.LlmService])
], RagService);
//# sourceMappingURL=rag.service.js.map