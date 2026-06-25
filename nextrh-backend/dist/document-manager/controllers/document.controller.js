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
var DocumentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const cv_parser_facade_1 = require("../services/cv-parser.facade");
const cv_evaluation_service_1 = require("../services/cv-evaluation.service");
const pdf_parser_service_1 = require("../services/pdf-parser.service");
const cv_heuristic_parser_service_1 = require("../services/cv-heuristic-parser.service");
let DocumentController = DocumentController_1 = class DocumentController {
    constructor(cvParserFacade, cvEvaluationService, pdfParserService, cvHeuristicParserService) {
        this.cvParserFacade = cvParserFacade;
        this.cvEvaluationService = cvEvaluationService;
        this.pdfParserService = pdfParserService;
        this.cvHeuristicParserService = cvHeuristicParserService;
        this.logger = new common_1.Logger(DocumentController_1.name);
    }
    async testPdf(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const rawText = await this.pdfParserService.extractRawText(file.buffer);
        return this.cvHeuristicParserService.parse(rawText, 1, 25, file.originalname);
    }
    async parseCv(file) {
        if (!file) {
            this.logger.warn('Attempted CV upload without a file.');
            throw new common_1.BadRequestException('Aucun fichier n\'a été fourni. Veuillez téléverser un CV au format PDF.');
        }
        if (file.mimetype !== 'application/pdf') {
            this.logger.warn(`Uploaded file has unsupported mimetype: ${file.mimetype}`);
            throw new common_1.BadRequestException('Type de fichier non supporté. Seuls les fichiers PDF sont acceptés.');
        }
        try {
            this.logger.log(`Received PDF upload: ${file.originalname} (${file.size} bytes)`);
            const result = await this.cvParserFacade.parseCv(file.buffer);
            return result;
        }
        catch (error) {
            this.logger.error(`Error occurred during CV parsing pipeline: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Une erreur interne est survenue lors du traitement sémantique du CV : ${error.message}`);
        }
    }
    async runEvaluation() {
        const report = await this.cvEvaluationService.runAcademicEvaluation();
        return {
            status: 'success',
            message: 'Évaluation académique terminée avec succès.',
            timestamp: new Date().toISOString(),
            report,
        };
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Post)('test-pdf'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "testPdf", null);
__decorate([
    (0, common_1.Post)('parse'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "parseCv", null);
__decorate([
    (0, common_1.Get)('evaluate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "runEvaluation", null);
exports.DocumentController = DocumentController = DocumentController_1 = __decorate([
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [cv_parser_facade_1.CvParserFacade,
        cv_evaluation_service_1.CvEvaluationService,
        pdf_parser_service_1.PdfParserService,
        cv_heuristic_parser_service_1.CvHeuristicParserService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map