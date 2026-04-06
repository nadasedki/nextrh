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
exports.SkillsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const skill_entity_1 = require("./entities/skill.entity");
const user_skill_entity_1 = require("./entities/user-skill.entity");
let SkillsService = class SkillsService {
    constructor(skillRepository, userSkillRepository) {
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
    }
    async findAllSkills() {
        return await this.skillRepository.find();
    }
    async addSkillToUser(userId, skillName, level) {
        let skill = await this.skillRepository.findOne({ where: { skill_name: skillName } });
        if (!skill) {
            skill = this.skillRepository.create({ skill_name: skillName });
            await this.skillRepository.save(skill);
        }
        const userSkill = this.userSkillRepository.create({
            user_id: userId,
            skill_id: skill.skill_id,
            level,
        });
        return await this.userSkillRepository.save(userSkill);
    }
};
exports.SkillsService = SkillsService;
exports.SkillsService = SkillsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(skill_entity_1.Skill)),
    __param(1, (0, typeorm_1.InjectRepository)(user_skill_entity_1.UserSkill)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SkillsService);
//# sourceMappingURL=skills.service.js.map