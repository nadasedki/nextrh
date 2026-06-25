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
exports.ExperienceController = void 0;
const common_1 = require("@nestjs/common");
const experience_service_1 = require("./experience.service");
const create_experience_dto_1 = require("./dto/create-experience.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ExperienceController = class ExperienceController {
    constructor(experienceService) {
        this.experienceService = experienceService;
    }
    create(req, createExperienceDto) {
        return this.experienceService.create({
            ...createExperienceDto,
            user_id: req.user.userId || req.user.id
        });
    }
    async findMyExperiences(req) {
        const userId = req.user.userId || req.user.id;
        return this.experienceService.findByUser(userId);
    }
    async update(id, req, updateDto) {
        const userId = req.user.userId || req.user.id;
        return this.experienceService.update(id, userId, updateDto);
    }
    async remove(id, req) {
        const userId = req.user.userId || req.user.id;
        return this.experienceService.remove(id, userId);
    }
};
exports.ExperienceController = ExperienceController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_experience_dto_1.CreateExperienceDto]),
    __metadata("design:returntype", void 0)
], ExperienceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExperienceController.prototype, "findMyExperiences", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], ExperienceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ExperienceController.prototype, "remove", null);
exports.ExperienceController = ExperienceController = __decorate([
    (0, common_1.Controller)('experiences'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [experience_service_1.ExperienceService])
], ExperienceController);
//# sourceMappingURL=experience.controller.js.map