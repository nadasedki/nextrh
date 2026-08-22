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
var RagOrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const rag_pipeline_service_1 = require("./rag-pipeline.service");
let RagOrchestratorService = RagOrchestratorService_1 = class RagOrchestratorService {
    constructor(pipeline) {
        this.pipeline = pipeline;
        this.logger = new common_1.Logger(RagOrchestratorService_1.name);
    }
    async ask(question) {
        if (!question || question.trim().length === 0) {
            throw new common_1.BadRequestException('Question cannot be empty.');
        }
        if (question.trim().length < 3) {
            throw new common_1.BadRequestException('Question is too short.');
        }
        this.logger.log(`Incoming RAG query: "${question.trim()}"`);
        const state = await this.pipeline.run(question.trim());
        const sources = state.reranked.map(r => ({
            text: r.payload?.text,
            type: r.payload?.type,
            candidate: r.payload?.full_name,
            user_id: r.payload?.user_id,
            score: r.score,
        }));
        const structured = state.structuredAnswer;
        return {
            answer: structured?.answer ?? state.answer ?? '',
            reasoning: structured?.reasoning ?? '',
            explanation: structured?.explanation ?? '',
            confidence: structured?.confidence ?? 0,
            llmSources: structured?.sources ?? [],
            sources,
            metrics: state.metadata,
        };
    }
};
exports.RagOrchestratorService = RagOrchestratorService;
exports.RagOrchestratorService = RagOrchestratorService = RagOrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rag_pipeline_service_1.RagPipelineService])
], RagOrchestratorService);
//# sourceMappingURL=rag-orchestrator.service.js.map