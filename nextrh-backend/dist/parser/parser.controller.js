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
exports.ParserController = void 0;
const parser_service_1 = require("./parser.service");
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const evaluation_metrics_service_1 = require("./evaluation-metrics.service");
let ParserController = class ParserController {
    constructor(parserService, AiService, metricsService) {
        this.parserService = parserService;
        this.AiService = AiService;
        this.metricsService = metricsService;
    }
    async extractCertificate(body) {
        const { filePath } = body;
        try {
            const data = await this.AiService.extractCertificate(filePath);
            return { status: 'success', data };
        }
        catch (e) {
            return { status: 'error', message: e.message };
        }
    }
    async triggerBatchEvaluation() {
        this.metricsService.runEvaluationAndSaveJson()
            .catch(err => console.error("Evaluation Async Error:", err));
        return {
            success: true,
            message: "Batch evaluation pipeline started. Checking files and generating metrics_report.json...",
        };
    }
};
exports.ParserController = ParserController;
__decorate([
    (0, common_1.Post)('extract-certificate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParserController.prototype, "extractCertificate", null);
__decorate([
    (0, common_1.Post)('evaluate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ParserController.prototype, "triggerBatchEvaluation", null);
exports.ParserController = ParserController = __decorate([
    (0, common_1.Controller)('parser'),
    __param(2, (0, common_1.Inject)(evaluation_metrics_service_1.EvaluationMetricsService)),
    __metadata("design:paramtypes", [parser_service_1.ParserService,
        ai_service_1.AiService,
        evaluation_metrics_service_1.EvaluationMetricsService])
], ParserController);
//# sourceMappingURL=parser.controller.js.map