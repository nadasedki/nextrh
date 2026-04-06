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
const certifications_service_1 = require("./certifications.service");
const create_certification_dto_1 = require("./dto/create-certification.dto");
const update_certification_dto_1 = require("./dto/update-certification.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let CertificationsController = class CertificationsController {
    constructor(service) {
        this.service = service;
    }
    getMyCertifications(req) {
        const userId = req.user?.sub || req.user?.userId || req.user?.id;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in token');
        }
        return this.service.findMyCertifications(userId);
    }
    create(req, dto) {
        const userId = req.user?.userId || req.user?.sub || req.user?.id || req.user?.user_id;
        if (!userId) {
            throw new Error('User ID is missing from JWT token!');
        }
        return this.service.create(userId, dto);
    }
    update(id, req, dto) {
        return this.service.update(+id, req.user.sub, dto);
    }
    remove(id, req) {
        return this.service.remove(+id, req.user.sub);
    }
    async uploadCertificate(file, req) {
        const userId = req.user?.userId;
        if (!file) {
            return { status: 'error', message: 'No file uploaded' };
        }
        const saved = await this.service.extractAndSaveCertificate(userId, file);
        return {
            status: 'success',
            data: saved,
            message: 'Certificate extracted and saved successfully',
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
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, update_certification_dto_1.UpdateCertificationDto]),
    __metadata("design:returntype", void 0)
], CertificationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], CertificationsController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CertificationsController.prototype, "uploadCertificate", null);
exports.CertificationsController = CertificationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('EMPLOYEE'),
    (0, common_1.Controller)('certifications'),
    __metadata("design:paramtypes", [certifications_service_1.CertificationsService])
], CertificationsController);
//# sourceMappingURL=certifications.controller.js.map