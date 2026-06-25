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
exports.ScoringService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const project_entity_1 = require("../project/entities/project.entity");
const training_entity_1 = require("../training/entities/training.entity");
const certification_entity_1 = require("../certifications/entities/certification.entity");
let ScoringService = class ScoringService {
    constructor(userRepository, projectRepository, trainingRepository, certificationRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.trainingRepository = trainingRepository;
        this.certificationRepository = certificationRepository;
    }
    async calculateAndSaveScore(userId) {
        const [certCount, projectCount, trainingCount] = await Promise.all([
            this.certificationRepository.count({ where: { userId: userId } }),
            this.projectRepository.count({ where: { user_id: userId } }),
            this.trainingRepository.count({ where: { user_id: userId } }),
        ]);
        const totalScore = (certCount * 10) + (projectCount * 20) + (trainingCount * 30);
        await this.userRepository.update(userId, { score: totalScore });
        return totalScore;
    }
    async getUserScore(userId) {
        const user = await this.userRepository.findOne({ where: { user_id: userId } });
        return user ? user.score : 0;
    }
    async getLeaderboard() {
        return await this.userRepository.find({
            select: ['user_id', 'full_name', 'score', 'title'],
            order: { score: 'DESC' },
        });
    }
};
exports.ScoringService = ScoringService;
exports.ScoringService = ScoringService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(2, (0, typeorm_1.InjectRepository)(training_entity_1.Training)),
    __param(3, (0, typeorm_1.InjectRepository)(certification_entity_1.Certification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ScoringService);
//# sourceMappingURL=scoring.service.js.map