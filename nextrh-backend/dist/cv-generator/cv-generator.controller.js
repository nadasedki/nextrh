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
var CvGeneratorController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvGeneratorController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const cv_template_service_1 = require("./cv-template.service");
const cv_data_formatter_service_1 = require("./cv-data-formatter.service");
const pdf_generator_service_1 = require("./pdf-generator.service");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
let CvGeneratorController = CvGeneratorController_1 = class CvGeneratorController {
    constructor(templateService, dataFormatter, pdfGenerator) {
        this.templateService = templateService;
        this.dataFormatter = dataFormatter;
        this.pdfGenerator = pdfGenerator;
        this.logger = new common_1.Logger(CvGeneratorController_1.name);
    }
    async uploadTemplate(file, name, userIdStr) {
        if (!file)
            throw new common_1.BadRequestException('A PDF template file is required.');
        if (!name)
            throw new common_1.BadRequestException('A template name is required.');
        const userId = parseInt(userIdStr, 10);
        if (isNaN(userId))
            throw new common_1.BadRequestException('userId must be a valid number.');
        try {
            const { templateId } = await this.templateService.extractSkeleton(file.buffer, name, userId);
            return {
                message: 'Template analyzed and stored. Ready for generation.',
                templateId,
            };
        }
        catch (err) {
            this.logger.error(`Template upload failed: ${err.message}`);
            throw new common_1.InternalServerErrorException(`Template analysis failed: ${err.message}`);
        }
    }
    async generateCv(templateIdStr, userIdStr, res) {
        if (!templateIdStr || !userIdStr) {
            throw new common_1.BadRequestException('templateId and userId are required.');
        }
        const templateId = templateIdStr;
        const userId = parseInt(userIdStr, 10);
        if (typeof templateId !== 'string' || isNaN(userId)) {
            throw new common_1.BadRequestException('templateId must be a valid UUID string and userId must be a valid number.');
        }
        try {
            const skeleton = await this.templateService.getSkeleton(templateId);
            const candidateData = await this.dataFormatter.getFormattedCandidateData(userId);
            const populatedHtml = await this.templateService.compileSkeleton(skeleton, candidateData);
            const pdfBuffer = await this.pdfGenerator.generate(populatedHtml);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="cv_${userId}_${templateId}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            return res.status(common_1.HttpStatus.OK).send(pdfBuffer);
        }
        catch (err) {
            this.logger.error(`CV generation failed: ${err.message}`);
            throw new common_1.InternalServerErrorException(`CV generation failed: ${err.message}`);
        }
    }
    async getTemplates() {
        return this.templateService.findAll();
    }
    async testCandidateData(userIdStr) {
        const userId = parseInt(userIdStr, 10);
        if (isNaN(userId)) {
            throw new common_1.BadRequestException('userId must be a valid number.');
        }
        try {
            const formattedData = await this.dataFormatter.getFormattedCandidateData(userId);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Successfully retrieved and formatted database records for user #${userId}`,
                data: formattedData,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(`Failed to retrieve and format candidate data: ${error.message}`);
        }
    }
};
exports.CvGeneratorController = CvGeneratorController;
__decorate([
    (0, common_1.Post)('templates/upload'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: (_req, file, cb) => {
            file.mimetype === 'application/pdf'
                ? cb(null, true)
                : cb(new common_1.BadRequestException('Only PDF files are accepted.'), false);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "uploadTemplate", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('templateId')),
    __param(1, (0, common_1.Body)('userId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "generateCv", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('test-data/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "testCandidateData", null);
exports.CvGeneratorController = CvGeneratorController = CvGeneratorController_1 = __decorate([
    (0, common_1.Controller)('cv'),
    __metadata("design:paramtypes", [cv_template_service_1.CvTemplateService,
        cv_data_formatter_service_1.CvDataFormatterService,
        pdf_generator_service_1.PdfGeneratorService])
], CvGeneratorController);
//# sourceMappingURL=cv-generator.controller.js.map