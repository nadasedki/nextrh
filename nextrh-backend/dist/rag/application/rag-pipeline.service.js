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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagPipelineService = void 0;
const common_1 = require("@nestjs/common");
const retrieval_service_1 = require("../retrieval/retrieval.service");
const prompt_service_1 = require("../prompting/prompt.service");
const llm_service_1 = require("../llm/llm.service");
const reranking_service_1 = require("../reranking/reranking.service");
let RagPipelineService = class RagPipelineService {
    constructor(retrieval, rerank, prompt, llm) {
        this.retrieval = retrieval;
        this.rerank = rerank;
        this.prompt = prompt;
        this.llm = llm;
    }
    async run(question) {
        const state = {
            question,
            retrieved: [],
            reranked: [],
        };
        state.retrieved = await this.retrieval.retrieve(question);
        state.reranked = this.rerank
            .rerank(question, state.retrieved)
            .slice(0, 5);
        state.prompt = this.prompt.build(question, state.reranked);
        state.answer = await this.llm.generate(state.prompt);
        return {
            answer: state.answer,
            sources: state.reranked.map(r => r.payload),
        };
    }
};
exports.RagPipelineService = RagPipelineService;
exports.RagPipelineService = RagPipelineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => retrieval_service_1.RetrievalService))),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => reranking_service_1.RerankingService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => prompt_service_1.PromptService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => llm_service_1.LlmService))),
    __metadata("design:paramtypes", [retrieval_service_1.RetrievalService,
        reranking_service_1.RerankingService,
        prompt_service_1.PromptService,
        llm_service_1.LlmService])
], RagPipelineService);
//# sourceMappingURL=rag-pipeline.service.js.map