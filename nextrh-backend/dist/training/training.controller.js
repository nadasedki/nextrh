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
exports.TrainingController = void 0;
const common_1 = require("@nestjs/common");
const training_service_1 = require("../training/training.service");
const create_training_dto_1 = require("./dto/create-training.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const update_training_dto_1 = require("./dto/update-training.dto");
let TrainingController = class TrainingController {
    constructor(trainingService) {
        this.trainingService = trainingService;
    }
    async createTraining(req, createDto) {
        console.log('🚨 TRAINING DEBUG - req.user:', req.user);
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('User ID is missing from JWT token!');
        }
        return this.trainingService.create(userId, createDto);
    }
    async findMine(req) {
        console.log('🚨 GET /trainings/me - Request received');
        const userId = req.user?.userId;
        console.log('🚨 GET /trainings/me - Found UserId:', userId);
        if (!userId) {
            throw new Error('User ID is missing from JWT token!');
        }
        return this.trainingService.findByUser(userId);
    }
    async updateTraining(req, id, updateDto) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('User ID is missing from JWT token!');
        }
        return this.trainingService.update(userId, id, updateDto);
    }
    async deleteTraining(req, id) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('User ID is missing from JWT token!');
        }
        return this.trainingService.remove(userId, id);
    }
};
exports.TrainingController = TrainingController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_training_dto_1.CreateTrainingDto]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "createTraining", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "findMine", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_training_dto_1.UpdateTrainingDto]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "updateTraining", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], TrainingController.prototype, "deleteTraining", null);
exports.TrainingController = TrainingController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('EMPLOYEE'),
    (0, common_1.Controller)('trainings'),
    __metadata("design:paramtypes", [training_service_1.TrainingService])
], TrainingController);
//# sourceMappingURL=training.controller.js.map