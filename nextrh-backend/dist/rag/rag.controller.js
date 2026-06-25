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
exports.RagController = void 0;
const common_1 = require("@nestjs/common");
const indexing_service_1 = require("./indexing/indexing.service");
const rag_orchestrator_service_1 = require("./application/rag-orchestrator.service");
const evaluation_service_1 = require("./evaluation/evaluation.service");
let RagController = class RagController {
    constructor(ragOrchestrator, indexingService, evaluationService) {
        this.ragOrchestrator = ragOrchestrator;
        this.indexingService = indexingService;
        this.evaluationService = evaluationService;
    }
    async ask(body) {
        return this.ragOrchestrator.ask(body.question);
    }
    async indexAll() {
        return this.indexingService.indexAllCVs();
    }
    async evaluate() {
        return this.evaluationService.runEvaluationSuite();
    }
};
exports.RagController = RagController;
__decorate([
    (0, common_1.Post)('ask'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RagController.prototype, "ask", null);
__decorate([
    (0, common_1.Post)('index-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RagController.prototype, "indexAll", null);
__decorate([
    (0, common_1.Post)('evaluate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RagController.prototype, "evaluate", null);
exports.RagController = RagController = __decorate([
    (0, common_1.Controller)('rag'),
    __metadata("design:paramtypes", [rag_orchestrator_service_1.RagOrchestratorService,
        indexing_service_1.IndexingService,
        evaluation_service_1.EvaluationService])
], RagController);
//# sourceMappingURL=rag.controller.js.map