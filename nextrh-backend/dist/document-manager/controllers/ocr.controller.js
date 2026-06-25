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
var OcrController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const ocr_service_1 = require("../services/ocr.service");
const cv_heuristic_parser_service_1 = require("../services/cv-heuristic-parser.service");
const perf_hooks_1 = require("perf_hooks");
const cv_parser_facade2_1 = require("../services/cv-parser.facade2");
let OcrController = OcrController_1 = class OcrController {
    constructor(ocrService, heuristicParser, cvParserFacade) {
        this.ocrService = ocrService;
        this.heuristicParser = heuristicParser;
        this.cvParserFacade = cvParserFacade;
        this.logger = new common_1.Logger(OcrController_1.name);
    }
    async extractTextFromPdf(file) {
        if (!file) {
            throw new common_1.BadRequestException('Aucun fichier fourni.');
        }
        if (file.mimetype !== 'application/pdf') {
            throw new common_1.BadRequestException('Seuls les fichiers au format PDF sont acceptés.');
        }
        try {
            const startTime = perf_hooks_1.performance.now();
            const extractedText = await this.ocrService.extractTextFromPdf(file.buffer, 'fra+eng');
            const durationMs = Math.round(perf_hooks_1.performance.now() - startTime);
            return {
                status: 'success',
                metadata: {
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size_bytes: file.size,
                    execution_time_ms: durationMs,
                    character_count: extractedText.length
                },
                extracted_text: extractedText,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`OCR extraction failed: ${error.message}`);
        }
    }
    async parseScannedPdf2(file) {
        if (!file) {
            throw new common_1.BadRequestException('Aucun fichier fourni. Veuillez téléverser un fichier PDF scanné.');
        }
        if (file.mimetype !== 'application/pdf') {
            throw new common_1.BadRequestException('Type de fichier invalide. Seuls les fichiers PDF sont acceptés.');
        }
        try {
            this.logger.log(`⚙️ Starting scanned PDF OCR + parsing pipeline for: ${file.originalname}`);
            const startTime = perf_hooks_1.performance.now();
            const ocrStartTime = perf_hooks_1.performance.now();
            const extractedText = await this.ocrService.extractTextFromPdf(file.buffer, 'fra+eng');
            const ocrDurationMs = Math.round(perf_hooks_1.performance.now() - ocrStartTime);
            this.logger.log(`⚙️ OCR extraction complete. Character count: ${extractedText.length}. Starting parsing pipeline...`);
            const parsingStartTime = perf_hooks_1.performance.now();
            const parsedData = this.heuristicParser.parse(extractedText, 1, 25, file.originalname);
            const parsingDurationMs = Math.round(perf_hooks_1.performance.now() - parsingStartTime);
            const totalDurationMs = Math.round(perf_hooks_1.performance.now() - startTime);
            this.logger.log(`⏱️ Scanned PDF OCR and parsing pipeline completed in ${(totalDurationMs / 1000).toFixed(2)}s.`);
            return {
                status: 'success',
                execution_metrics: {
                    total_time_ms: totalDurationMs,
                    ocr_extraction_time_ms: ocrDurationMs,
                    heuristic_parsing_time_ms: parsingDurationMs,
                    character_count: extractedText.length
                },
                data: {
                    contact: {
                        name: parsedData.full_name,
                        profession: parsedData.profession,
                        phone: parsedData.phone,
                        fax: parsedData.fax,
                        email: parsedData.email,
                        address: parsedData.address,
                        skills: parsedData.skills
                    },
                    experience: parsedData.experiences.map((exp) => ({
                        period: exp.period || null,
                        company: exp.company,
                        role: exp.role
                    })),
                    certifications: parsedData.certifications.map((cert) => ({
                        certName: cert.cert_name,
                        date: cert.date || null
                    })),
                    education: parsedData.education.map((edu) => ({
                        year: edu.year || null,
                        institution: edu.institution,
                        degree: edu.degree
                    })),
                    projects: parsedData.projects.map((proj) => ({
                        year: proj.year || null,
                        client: proj.client,
                        description: proj.description
                    }))
                }
            };
        }
        catch (error) {
            this.logger.error(`Scanned PDF parsing failed: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Une erreur est survenue lors de l'analyse OCR et du parsing du PDF : ${error.message}`);
        }
    }
    async parseScannedPdf(file) {
        if (!file) {
            throw new common_1.BadRequestException('Aucun fichier fourni. Veuillez téléverser un fichier PDF.');
        }
        if (file.mimetype !== 'application/pdf') {
            throw new common_1.BadRequestException('Seuls les fichiers au format PDF sont acceptés.');
        }
        try {
            this.logger.log(`⚙️ Routing scanned PDF to the Hybrid Facade: ${file.originalname}`);
            const result = await this.cvParserFacade.parseScannedCv(file.buffer);
            return result;
        }
        catch (error) {
            this.logger.error(`Scanned PDF hybrid parsing failed: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Une erreur est survenue lors de l'analyse hybride OCR/LLM : ${error.message}`);
        }
    }
};
exports.OcrController = OcrController;
__decorate([
    (0, common_1.Post)('extract-pdf'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "extractTextFromPdf", null);
__decorate([
    (0, common_1.Post)('parse-scanned2'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "parseScannedPdf2", null);
__decorate([
    (0, common_1.Post)('parse-scanned'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "parseScannedPdf", null);
exports.OcrController = OcrController = OcrController_1 = __decorate([
    (0, common_1.Controller)('ocr'),
    __metadata("design:paramtypes", [ocr_service_1.OcrService,
        cv_heuristic_parser_service_1.CvHeuristicParserService,
        cv_parser_facade2_1.CvParserFacade2])
], OcrController);
//# sourceMappingURL=ocr.controller.js.map