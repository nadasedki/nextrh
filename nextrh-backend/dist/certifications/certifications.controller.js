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
exports.CertificationsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const certifications_service_1 = require("./services/certifications.service");
const create_certification_dto_1 = require("./dto/create-certification.dto");
const update_certification_dto_1 = require("./dto/update-certification.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const certifications_extraction_service_1 = require("./services/certifications-extraction.service");
let CertificationsController = class CertificationsController {
    constructor(service, parserService) {
        this.service = service;
        this.parserService = parserService;
    }
    getMyCertifications(req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in token');
        }
        return this.service.findMyCertifications(userId);
    }
    create(req, dto) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('User ID is missing from JWT token!');
        }
        return this.service.create(userId, dto);
    }
    async update(id, req, dto) {
        const userId = req.user?.userId;
        return this.service.update(id, userId, dto);
    }
    async remove(id, req) {
        const userId = req.user?.userId;
        return this.service.remove(id, userId);
    }
    async parseCertificatePreview(file, req) {
        const userId = req.user?.userId;
        const userFullName = req.user.full_name;
        console.log(`User ID: ${userId}, Full Name from JWT: ${userFullName}`);
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const previewData = await this.parserService.extractAndPreviewCertificate(userId, file, userFullName);
        return {
            status: 'success',
            data: previewData,
        };
    }
};
exports.CertificationsController = CertificationsController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CertificationsController.prototype, "getMyCertifications", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_certification_dto_1.CreateCertificationDto]),
    __metadata("design:returntype", void 0)
], CertificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, update_certification_dto_1.UpdateCertificationDto]),
    __metadata("design:returntype", Promise)
], CertificationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CertificationsController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('parse-preview'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CertificationsController.prototype, "parseCertificatePreview", null);
exports.CertificationsController = CertificationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('EMPLOYEE'),
    (0, common_1.Controller)('certifications'),
    __metadata("design:paramtypes", [certifications_service_1.CertificationsService,
        certifications_extraction_service_1.CertificationsParserService])
], CertificationsController);
//# sourceMappingURL=certifications.controller.js.map