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
const rag_pipeline_service_1 = require("./application/rag-pipeline.service");
const rag_orchestrator_service_1 = require("./application/rag-orchestrator.service");
const indexing_service_1 = require("./indexing/indexing.service");
const evaluation_service_1 = require("./evaluation/evaluation.service");
const query_preprocessor_service_1 = require("./retrieval/query-preprocessor.service");
const EmployeesModule_1 = require("../Employee/EmployeesModule");
const indexing_event_listener_1 = require("./indexing/indexing-event.listener");
const vector_mapping_repository_1 = require("./indexing/vector-mapping.repository");
const evaluation_controller_1 = require("./evaluation/evaluation.controller");
const bullMQ_js_1 = require("@bull-board/api/dist/queueAdapters/bullMQ.js");
const bull_board_module_1 = require("@bull-board/nestjs/dist/bull-board.module");
const bullmq_1 = require("@nestjs/bullmq");
const vector_indexing_processor_1 = require("./indexing/processors/vector-indexing.processor");
let RagModule = class RagModule {
};
exports.RagModule = RagModule;
exports.RagModule = RagModule = __decorate([
    (0, common_1.Module)({
        imports: [bullmq_1.BullModule.registerQueue({
                name: 'vector-indexing',
            }),
            bull_board_module_1.BullBoardModule.forFeature({
                name: 'vector-indexing',
                adapter: bullMQ_js_1.BullMQAdapter,
            }), EmployeesModule_1.EmployeesModule],
        controllers: [rag_controller_1.RagController, evaluation_controller_1.EvaluationController],
        providers: [
            embedding_service_1.EmbeddingService,
            vector_service_1.VectorService,
            chunking_service_1.ChunkingService,
            prompt_service_1.PromptService,
            llm_service_1.LlmService,
            retrieval_service_1.RetrievalService,
            vector_indexing_processor_1.VectorIndexingProcessor,
            rag_pipeline_service_1.RagPipelineService,
            rag_orchestrator_service_1.RagOrchestratorService,
            indexing_service_1.IndexingService,
            indexing_event_listener_1.IndexingEventListener,
            vector_mapping_repository_1.VectorMappingRepository,
            query_preprocessor_service_1.QueryPreprocessorService,
            evaluation_service_1.EvaluationService,
        ],
        exports: [],
    })
], RagModule);
//# sourceMappingURL=rag.module.js.map