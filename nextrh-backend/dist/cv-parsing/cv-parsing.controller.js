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
exports.CvParsingController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const cv_parsing_service_1 = require("./cv-parsing.service");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let CvParsingController = class CvParsingController {
    constructor(CvParsingService) {
        this.CvParsingService = CvParsingService;
    }
    async testPdf(body) {
        const text = await this.CvParsingService.extractTextFromPdf(body.filePath);
        return {
            status: 'success',
            raw_text: text,
        };
    }
    async uploadFile(req, file) {
        if (!file) {
            throw new Error('No file uploaded');
        }
        const absolutePath = require('path').resolve(file.path);
        const employeeId = req.user.userId;
        const organizedData = await this.CvParsingService.processPdf(absolutePath, employeeId);
        return {
            status: "success",
            data: organizedData,
        };
    }
};
exports.CvParsingController = CvParsingController;
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CvParsingController.prototype, "testPdf", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                callback(null, `${file.fieldname}-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CvParsingController.prototype, "uploadFile", null);
exports.CvParsingController = CvParsingController = __decorate([
    (0, common_1.Controller)('cv-parsing'),
    __metadata("design:paramtypes", [cv_parsing_service_1.CvParsingService])
], CvParsingController);
//# sourceMappingURL=cv-parsing.controller.js.map