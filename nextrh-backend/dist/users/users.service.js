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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("./entities/role.entity");
const team_entity_1 = require("./entities/team.entity");
const typeorm_2 = require("@nestjs/typeorm");
const experience_entity_1 = require("../experience/entities/experience.entity");
let UsersService = class UsersService {
    constructor(userRepo, roleRepo, teamRepo, experienceRepo) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.teamRepo = teamRepo;
        this.experienceRepo = experienceRepo;
    }
    async create(dto) {
        const roles = await this.roleRepo.findByIds(dto.role_ids);
        const user = this.userRepo.create({
            email: dto.email,
            password_hash: dto.password_hash,
            full_name: dto.full_name,
            roles,
        });
        return this.userRepo.save(user);
    }
    async findByEmail(email) {
        return this.userRepo.findOne({ where: { email }, relations: ['roles'] });
    }
    async findAll() {
        return this.userRepo.find({ relations: ['roles'] });
    }
    async update(user_id, dto) {
        const user = await this.userRepo.findOne({ where: { user_id }, relations: ['roles'] });
        if (!user)
            return null;
        if (dto.full_name)
            user.full_name = dto.full_name;
        if (dto.role_ids)
            user.roles = await this.roleRepo.findByIds(dto.role_ids);
        if (dto.active !== undefined)
            user.active = dto.active;
        return this.userRepo.save(user);
    }
    async findOneById(user_id) {
        return this.userRepo.findOne({ where: { user_id }, relations: ['roles'] });
    }
    async remove(user_id) {
        const user = await this.userRepo.findOne({ where: { user_id } });
        if (!user)
            return null;
        user.active = false;
        return this.userRepo.save(user);
    }
    async findTeamMembers(team_leader_id) {
        const team = await this.teamRepo.findOne({ where: { team_leader_id } });
        if (!team)
            return [];
        const members = await this.userRepo
            .createQueryBuilder('user')
            .innerJoin('team_members', 'tm', 'tm.user_id = user.user_id')
            .where('tm.team_id = :teamId', { teamId: team.team_id })
            .leftJoinAndSelect('user.roles', 'roles')
            .getMany();
        return members;
    }
    async updatePassword(userId, hashedPassword) {
        const user = await this.userRepo.findOne({ where: { user_id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.password_hash = hashedPassword;
        return this.userRepo.save(user);
    }
    async updateProfileFromCv(userId, fullName, title) {
        const user = await this.userRepo.findOne({
            where: { user_id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (fullName) {
            user.full_name = fullName;
        }
        if (title) {
            user.title = title;
        }
        return this.userRepo.save(user);
    }
    async updateYearsOfExperience(userId, years) {
        await this.userRepo.update(userId, {
            years_of_experience: years,
        });
        return years;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_2.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_2.InjectRepository)(team_entity_1.Team)),
    __param(3, (0, typeorm_2.InjectRepository)(experience_entity_1.Experience)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map