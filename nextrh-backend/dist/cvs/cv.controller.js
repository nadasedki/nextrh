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
exports.CvController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const cv_service_1 = require("./cv.service");
let CvController = class CvController {
    constructor(cvService) {
        this.cvService = cvService;
    }
    async uploadCv(req, file) {
        if (!file) {
            throw new common_1.BadRequestException('Aucun fichier n\'a été fourni. Veuillez téléverser un CV au format PDF.');
        }
        if (file.mimetype !== 'application/pdf') {
            throw new common_1.BadRequestException('Type de fichier non supporté. Seuls les fichiers PDF sont acceptés.');
        }
        const userId = req.user?.userId || req.user?.id || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('Utilisateur non authentifié.');
        }
        return await this.cvService.enqueueCvUpload(userId, file);
    }
    async getJobStatus(jobId) {
        if (!jobId) {
            throw new common_1.BadRequestException('Identifiant de tâche (jobId) manquant.');
        }
        return await this.cvService.getJobStatus(jobId);
    }
    async removeCv(cvId, req) {
        const userId = req.user?.userId || req.user?.id || req.user?.sub;
        const cvIdNumber = Number(cvId);
        if (!Number.isInteger(cvIdNumber) || cvIdNumber <= 0) {
            throw new common_1.BadRequestException('Identifiant du CV invalide.');
        }
        await this.cvService.remove(cvIdNumber, userId);
        return {
            message: 'CV supprimé avec succès.',
        };
    }
};
exports.CvController = CvController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('upload'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "uploadCv", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "getJobStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':cvId'),
    __param(0, (0, common_1.Param)('cvId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "removeCv", null);
exports.CvController = CvController = __decorate([
    (0, common_1.Controller)('cvs'),
    __metadata("design:paramtypes", [cv_service_1.CvService])
], CvController);
//# sourceMappingURL=cv.controller.js.map