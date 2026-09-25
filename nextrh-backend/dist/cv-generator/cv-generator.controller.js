"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvGeneratorController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const cv_template_service_1 = require("./services/cv-template.service");
const cv_generator_service_1 = require("./services/cv-generator.service");
const fs = __importStar(require("fs"));
let CvGeneratorController = class CvGeneratorController {
    constructor(templateService, generatorService) {
        this.templateService = templateService;
        this.generatorService = generatorService;
    }
    async uploadTemplate(file, name, req) {
        if (!file)
            throw new common_1.BadRequestException('A PDF template file is required.');
        if (!name)
            throw new common_1.BadRequestException('A template name is required.');
        const userId = req.user?.userId || req.user?.id || 1;
        return await this.templateService.enqueueTemplateIngestion(file, name, userId);
    }
    async getTemplateIngestionStatus(jobId) {
        return await this.templateService.getIngestionJobStatus(jobId);
    }
    async getTemplates() {
        return await this.templateService.findAll();
    }
    async deleteTemplate(id) {
        await this.templateService.remove(id);
        return { message: 'Template deleted successfully.' };
    }
    async generateCv(templateId, userId) {
        if (!templateId || !userId) {
            throw new common_1.BadRequestException('templateId and userId are required.');
        }
        return await this.generatorService.enqueueCvGeneration(templateId, Number(userId));
    }
    async getCvGenerationStatus(jobId) {
        return await this.generatorService.getGenerationJobStatus(jobId);
    }
    async downloadGeneratedPdf(fileName, res) {
        if (!fileName)
            throw new common_1.BadRequestException('File name is required.');
        const filePath = this.generatorService.getGeneratedFilePath(fileName);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Generated PDF file not found on server.');
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.sendFile(filePath);
    }
};
exports.CvGeneratorController = CvGeneratorController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('templates/upload'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "uploadTemplate", null);
__decorate([
    (0, common_1.Get)('templates/status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "getTemplateIngestionStatus", null);
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)('templateId')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "generateCv", null);
__decorate([
    (0, common_1.Get)('generate/status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "getCvGenerationStatus", null);
__decorate([
    (0, common_1.Get)('download/:fileName'),
    __param(0, (0, common_1.Param)('fileName')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CvGeneratorController.prototype, "downloadGeneratedPdf", null);
exports.CvGeneratorController = CvGeneratorController = __decorate([
    (0, common_1.Controller)('cv'),
    __metadata("design:paramtypes", [cv_template_service_1.CvTemplateService,
        cv_generator_service_1.CvGeneratorService])
], CvGeneratorController);
//# sourceMappingURL=cv-generator.controller.js.map