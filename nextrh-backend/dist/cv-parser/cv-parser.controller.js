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
var CvParserController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvParserController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const cv_extraction_orchestrator_service_1 = require("./cv-extraction-orchestrator.service");
const cv_evaluation_service_1 = require("./services/cv-evaluation.service");
const config_1 = require("@nestjs/config");
const cv_multimodal_parser_service_1 = require("./cv-multimodal-parser.service");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
let CvParserController = CvParserController_1 = class CvParserController {
    constructor(cvParserOrchestrator, cvEvaluationService, configService, geminiParser) {
        this.cvParserOrchestrator = cvParserOrchestrator;
        this.cvEvaluationService = cvEvaluationService;
        this.configService = configService;
        this.geminiParser = geminiParser;
        this.logger = new common_1.Logger(CvParserController_1.name);
    }
    async parseCv(file) {
        if (!file) {
            this.logger.warn('CV upload attempted with no file.');
            throw new common_1.BadRequestException('No file provided. Please upload a PDF CV.');
        }
        this.logger.log(`CV upload received: ${file.originalname} (${file.size} bytes)`);
        const mode = this.configService.get('PARSER_MODE', 'heuristic');
        try {
            if (mode === 'gemini') {
                this.logger.log('Using Gemini multimodal parser strategy [1]');
                return await this.geminiParser.parseCvPdf(file.buffer);
            }
            this.logger.log('Using heuristic cascade parser strategy [1]');
            return await this.cvParserOrchestrator.parseCv(file.buffer);
        }
        catch (err) {
            this.logger.error(`CV parsing failed (mode: ${mode}): ${err.message}`);
            throw new common_1.InternalServerErrorException('An error occurred during CV processing. Please try again.');
        }
    }
    async runEvaluation(cacheOnlyStr) {
        this.logger.log('Academic evaluation suite triggered.');
        const cacheOnly = cacheOnlyStr === 'true';
        const report = await this.cvEvaluationService.runAcademicEvaluation(cacheOnly);
        return {
            status: 'success',
            message: cacheOnly
                ? 'Incremental evaluation report generated from cached runs.'
                : 'Complete academic evaluation completed successfully.',
            timestamp: new Date().toISOString(),
            report,
        };
    }
    async evaluateSingleCv(fileName) {
        this.logger.log(`Single CV evaluation triggered for file: ${fileName}`);
        return await this.cvEvaluationService.evaluateCv(fileName);
    }
};
exports.CvParserController = CvParserController;
__decorate([
    (0, common_1.Post)('parse'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_FILE_SIZE_BYTES },
        fileFilter: (_req, file, cb) => {
            file.mimetype === 'application/pdf'
                ? cb(null, true)
                : cb(new common_1.BadRequestException('Only PDF files are accepted.'), false);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CvParserController.prototype, "parseCv", null);
__decorate([
    (0, common_1.Get)('evaluate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('cacheOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvParserController.prototype, "runEvaluation", null);
__decorate([
    (0, common_1.Get)('evaluate/:fileName'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('fileName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvParserController.prototype, "evaluateSingleCv", null);
exports.CvParserController = CvParserController = CvParserController_1 = __decorate([
    (0, common_1.Controller)('cv-parser'),
    __metadata("design:paramtypes", [cv_extraction_orchestrator_service_1.CvExtractionOrchestrator,
        cv_evaluation_service_1.CvEvaluationService,
        config_1.ConfigService,
        cv_multimodal_parser_service_1.CvMultimodalParserService])
], CvParserController);
//# sourceMappingURL=cv-parser.controller.js.map