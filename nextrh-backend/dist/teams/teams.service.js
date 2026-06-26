"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const team_entity_1 = require("../users/entities/team.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_service_1 = require("../users/users.service");
const auth_service_1 = require("../auth/auth.service");
const bcrypt = __importStar(require("bcrypt"));
let TeamsService = class TeamsService {
    constructor(teamRepo, userRepo, usersService, authService) {
        this.teamRepo = teamRepo;
        this.userRepo = userRepo;
        this.usersService = usersService;
        this.authService = authService;
    }
    async addMemberByEmail(leaderId, email) {
        const team = await this.teamRepo.findOne({
            where: { team_leader_id: leaderId },
            relations: ['members'],
        });
        if (!team)
            throw new common_1.NotFoundException('Team not found for this leader');
        let user = await this.usersService.findByEmail(email);
        if (!user) {
            const generatedPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);
            const registerDto = {
                email: email,
                password_hash: hashedPassword,
                full_name: email.split('@')[0],
                role_id: 1,
            };
            user = await this.usersService.create(registerDto);
            await this.authService.sendWelcomeEmail(email, generatedPassword, user.full_name);
        }
        if (team.members.some(m => m.user_id === user.user_id)) {
            throw new common_1.BadRequestException('User is already a member of this team');
        }
        team.members.push(user);
        await this.teamRepo.save(team);
        return { message: 'Member successfully invited and added to team', user_id: user.user_id };
    }
    create(dto) {
        const team = this.teamRepo.create(dto);
        return this.teamRepo.save(team);
    }
    findAll() {
        return this.teamRepo.find({
            relations: ['members', 'members.role'],
        });
    }
    async getMyTeam(leaderId) {
        const team = await this.teamRepo.findOne({
            where: { team_leader_id: leaderId },
            relations: [
                'members',
                'members.role',
                'members.certifications'
            ],
        });
        if (!team)
            throw new common_1.NotFoundException('No team found for this leader');
        return team;
    }
    async addMember(dto) {
        const team = await this.teamRepo.findOne({
            where: { team_id: dto.team_id },
            relations: ['members'],
        });
        if (!team)
            throw new common_1.NotFoundException('Team not found');
        const user = await this.userRepo.findOne({
            where: { user_id: dto.user_id },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (team.members.some(member => member.user_id === user.user_id)) {
            throw new common_1.BadRequestException('User is already a member of this team');
        }
        team.members.push(user);
        await this.teamRepo.save(team);
        return { message: 'User added to team' };
    }
    async findByLeader(leaderId) {
        const team = await this.teamRepo.findOne({
            where: { team_leader_id: leaderId },
            relations: ['members'],
        });
        if (!team)
            throw new common_1.NotFoundException('Team not found for this leader');
        return team;
    }
    async removeMember(dto) {
        const team = await this.teamRepo.findOne({
            where: { team_id: dto.team_id },
            relations: ['members'],
        });
        if (!team)
            throw new common_1.NotFoundException('Team not found');
        team.members = team.members.filter(member => member.user_id !== dto.user_id);
        await this.teamRepo.save(team);
        return { message: 'User removed from team' };
    }
    async findOne(id) {
        const team = await this.teamRepo.findOne({
            where: { team_id: id },
            relations: ['members', 'members.role'],
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        return team;
    }
    async findMembersByManager(managerId) {
        const team = await this.getMyTeam(managerId);
        return team.members.map(member => ({
            id: member.user_id,
            name: member.full_name,
            email: member.email,
            title: member.title || 'N/A',
            yearsOfExperience: member.years_of_experience || 0,
            certifications: member.certifications || [],
        }));
    }
    async calculateTeamStats(leaderId) {
        const team = await this.teamRepo.findOne({
            where: { team_leader_id: leaderId },
            relations: ['members', 'members.certifications'],
        });
        if (!team)
            throw new common_1.NotFoundException('No team found for this leader');
        const members = team.members;
        const allCerts = members.flatMap(m => m.certifications);
        const certStats = {
            active: allCerts.filter(c => c.status === 'active').length,
            expiringSoon: allCerts.filter(c => c.status === 'expiring_soon').length,
            expired: allCerts.filter(c => c.status === 'expired').length,
        };
        const providerStats = allCerts.reduce((acc, cert) => {
            acc[cert.provider] = (acc[cert.provider] || 0) + 1;
            return acc;
        }, {});
        const topProviders = Object.entries(providerStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        const expiringCerts = allCerts
            .filter(c => c.status === 'expiring_soon')
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
            .slice(0, 5)
            .map(c => {
            const member = members.find(m => m.certifications.some(mc => mc.certId === c.certId));
            return {
                ...c,
                employeeName: member?.full_name || 'Unknown'
            };
        });
        return {
            teamName: team.team_name,
            totalMembers: members.length,
            certStats,
            topProviders,
            expiringCerts,
        };
    }
    async findAllTeamCertifications(leaderId) {
        const team = await this.teamRepo.findOne({
            where: { team_leader_id: leaderId },
            relations: ['members', 'members.certifications'],
        });
        if (!team)
            throw new common_1.NotFoundException('No team found for this leader');
        const certsWithEmployee = team.members.flatMap(member => member.certifications.map(cert => ({
            ...cert,
            employeeName: member.full_name,
            employeeTitle: member.title || 'N/A',
        })));
        return certsWithEmployee;
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(team_entity_1.Team)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        auth_service_1.AuthService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map