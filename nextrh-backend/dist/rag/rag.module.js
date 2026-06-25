"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagModule = void 0;
const common_1 = require("@nestjs/common");
const rag_controller_1 = require("./rag.controller");
const embedding_service_1 = require("./embedding/embedding.service");
const vector_service_1 = require("./vector/vector.service");
const chunking_service_1 = require("./chunking/chunking.service");
const prompt_service_1 = require("./prompting/prompt.service");
const llm_service_1 = require("./llm/llm.service");
const retrieval_service_1 = require("./retrieval/retrieval.service");
const reranking_service_1 = require("./reranking/reranking.service");
const cv_service_1 = require("./cv.service");
const rag_pipeline_service_1 = require("./application/rag-pipeline.service");
const rag_orchestrator_service_1 = require("./application/rag-orchestrator.service");
const indexing_service_1 = require("./indexing/indexing.service");
const rag_service_1 = require("./rag.service");
const evaluation_service_1 = require("./evaluation/evaluation.service");
let RagModule = class RagModule {
};
exports.RagModule = RagModule;
exports.RagModule = RagModule = __decorate([
    (0, common_1.Module)({
        controllers: [rag_controller_1.RagController],
        providers: [
            embedding_service_1.EmbeddingService,
            vector_service_1.VectorService,
            chunking_service_1.ChunkingService,
            prompt_service_1.PromptService,
            llm_service_1.LlmService,
            retrieval_service_1.RetrievalService,
            reranking_service_1.RerankingService,
            cv_service_1.CvService,
            rag_pipeline_service_1.RagPipelineService,
            rag_orchestrator_service_1.RagOrchestratorService,
            indexing_service_1.IndexingService,
            rag_service_1.RagService,
            evaluation_service_1.EvaluationService,
        ],
        exports: [rag_service_1.RagService],
    })
], RagModule);
//# sourceMappingURL=rag.module.js.map