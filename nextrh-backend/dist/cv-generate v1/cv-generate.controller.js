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
exports.CvGenerateController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const cv_generate_service_1 = require("./cv-generate.service");
let CvGenerateController = class CvGenerateController {
    constructor(cvService) {
        this.cvService = cvService;
    }
    async smartGenerate(cvId, file, res) {
        if (!file) {
            throw new common_1.BadRequestException('Aucun fichier template fourni');
        }
        try {
            console.log(`Début de la génération intelligente pour le CV #${cvId}`);
            const finalBuffer = await this.cvService.processSmartTemplate(+cvId, file);
            const outputFileName = `CV_Final_${Date.now()}.docx`;
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename=${outputFileName}`,
                'Content-Length': finalBuffer.length,
            });
            return res.end(finalBuffer);
        }
        catch (error) {
            console.error('Erreur Controller:', error.message);
            res.status(500).json({
                message: 'Erreur lors de la génération intelligente du CV',
                error: error.message,
            });
        }
    }
};
exports.CvGenerateController = CvGenerateController;
__decorate([
    (0, common_1.Post)('smart-pdf/:cvId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('cvId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CvGenerateController.prototype, "smartGenerate", null);
exports.CvGenerateController = CvGenerateController = __decorate([
    (0, common_1.Controller)('cv'),
    __metadata("design:paramtypes", [cv_generate_service_1.CvGenerateService])
], CvGenerateController);
//# sourceMappingURL=cv-generate.controller.js.map