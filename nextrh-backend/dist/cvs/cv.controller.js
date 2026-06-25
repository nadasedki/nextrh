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
var CvController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvController = void 0;
const common_1 = require("@nestjs/common");
const cv_service_1 = require("./cv.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const platform_express_1 = require("@nestjs/platform-express");
const cv_import_service_1 = require("./cv-import/cv-import.service");
let CvController = CvController_1 = class CvController {
    constructor(cvService, cvImportService) {
        this.cvService = cvService;
        this.cvImportService = cvImportService;
        this.logger = new common_1.Logger(CvController_1.name);
    }
    async uploadCv(req, file) {
        if (!file) {
            throw new common_1.BadRequestException('Aucun fichier n\'a été fourni. Veuillez téléverser un CV au format PDF.');
        }
        if (file.mimetype !== 'application/pdf') {
            this.logger.warn(`Unsupported upload attempt with mimetype: ${file.mimetype}`);
            throw new common_1.BadRequestException('Type de fichier non supporté. Seurs les fichiers PDF sont acceptés.');
        }
        try {
            const userId = req.user.userId;
            this.logger.log(`Initiating parsing pipeline for user ${userId} with file: ${file.originalname}`);
            const result = await this.cvImportService.uploadAndSaveCv(file.buffer, userId, file.originalname);
            return result;
        }
        catch (error) {
            this.logger.error(`Critical failure in upload execution trace: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Une erreur est survenue lors du traitement automatisé de votre CV : ${error.message}`);
        }
    }
};
exports.CvController = CvController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CvController.prototype, "uploadCv", null);
exports.CvController = CvController = CvController_1 = __decorate([
    (0, common_1.Controller)('cvs'),
    __metadata("design:paramtypes", [cv_service_1.CvService,
        cv_import_service_1.CvImportService])
], CvController);
//# sourceMappingURL=cv.controller.js.map