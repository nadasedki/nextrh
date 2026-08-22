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
var RagPipelineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagPipelineService = void 0;
const common_1 = require("@nestjs/common");
const perf_hooks_1 = require("perf_hooks");
const retrieval_service_1 = require("../retrieval/retrieval.service");
const reranking_service_1 = require("../reranking/reranking.service");
const prompt_service_1 = require("../prompting/prompt.service");
const llm_service_1 = require("../llm/llm.service");
let RagPipelineService = RagPipelineService_1 = class RagPipelineService {
    constructor(retrievalService, rerankingService, promptService, llmService) {
        this.retrievalService = retrievalService;
        this.rerankingService = rerankingService;
        this.promptService = promptService;
        this.llmService = llmService;
        this.logger = new common_1.Logger(RagPipelineService_1.name);
    }
    async run(question) {
        const pipelineStart = perf_hooks_1.performance.now();
        const state = {
            question,
            retrieved: [],
            reranked: [],
            metadata: {
                retrievalTimeMs: 0,
                rerankTimeMs: 0,
                promptBuildTimeMs: 0,
                llmTimeMs: 0,
                totalTimeMs: 0,
                retrievedCount: 0,
                rerankedCount: 0,
            },
        };
        const retrievalStart = perf_hooks_1.performance.now();
        state.retrieved = await this.retrievalService.retrieve(question);
        state.metadata.retrievalTimeMs = Math.round(perf_hooks_1.performance.now() - retrievalStart);
        state.metadata.retrievedCount = state.retrieved.length;
        this.logger.log(`Retrieval done: ${state.retrieved.length} candidates in ${state.metadata.retrievalTimeMs}ms`);
        state.reranked = state.retrieved.slice(0, 7);
        state.metadata.rerankedCount = state.reranked.length;
        state.metadata.rerankTimeMs = 0;
        this.logger.log(`Reranking Bypassed: Selected top ${state.reranked.length} .`);
        const promptStart = perf_hooks_1.performance.now();
        state.prompt = this.promptService.build(question, state.reranked);
        state.metadata.promptBuildTimeMs = Math.round(perf_hooks_1.performance.now() - promptStart);
        this.logger.log(`Prompt built in ${state.metadata.promptBuildTimeMs}ms`);
        const llmStart = perf_hooks_1.performance.now();
        const structured = await this.llmService.generate(state.prompt, this.promptService.OUTPUT_SCHEMA);
        state.metadata.llmTimeMs = Math.round(perf_hooks_1.performance.now() - llmStart);
        this.logger.log(`LLM generation done in ${state.metadata.llmTimeMs}ms`);
        state.answer = JSON.stringify(structured);
        state.structuredAnswer = structured;
        state.metadata.totalTimeMs = Math.round(perf_hooks_1.performance.now() - pipelineStart);
        this.logger.log(`Pipeline complete in ${state.metadata.totalTimeMs}ms ` +
            `(retrieval: ${state.metadata.retrievalTimeMs}ms, ` +
            `rerank: ${state.metadata.rerankTimeMs}ms, ` +
            `prompt: ${state.metadata.promptBuildTimeMs}ms, ` +
            `llm: ${state.metadata.llmTimeMs}ms)`);
        return state;
    }
    async runWithoutReranking(question) {
        const state = {
            question,
            retrieved: [],
            reranked: [],
            metadata: {
                retrievalTimeMs: 0, rerankTimeMs: 0,
                promptBuildTimeMs: 0, llmTimeMs: 0,
                totalTimeMs: 0, retrievedCount: 0, rerankedCount: 0,
            },
        };
        state.retrieved = await this.retrievalService.retrieve(question);
        state.reranked = state.retrieved.slice(0, 5);
        state.prompt = this.promptService.build(question, state.reranked);
        const structured = await this.llmService.generate(state.prompt, this.promptService.OUTPUT_SCHEMA);
        state.structuredAnswer = structured;
        state.answer = JSON.stringify(structured);
        return state;
    }
};
exports.RagPipelineService = RagPipelineService;
exports.RagPipelineService = RagPipelineService = RagPipelineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [retrieval_service_1.RetrievalService,
        reranking_service_1.RerankingService,
        prompt_service_1.PromptService,
        llm_service_1.LlmService])
], RagPipelineService);
//# sourceMappingURL=rag-pipeline.service.js.map