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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const team_entity_1 = require("./entities/team.entity");
const user_entity_1 = require("../users/entities/user.entity");
const users_service_1 = require("../users/users.service");
const auth_service_1 = require("../auth/auth.service");
const uuid_1 = require("uuid");
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
            throw new common_1.NotFoundException('No team found for this Team Leader');
        let user = await this.usersService.findByEmail(email);
        if (!user) {
            const tempPassword = (0, uuid_1.v4)();
            user = await this.usersService.create({
                email,
                full_name: email.split('@')[0],
                password: tempPassword,
                role_id: 1,
            });
            await this.authService.forgotPassword({ email });
            user = await this.usersService.findByEmail(email);
        }
        else {
            const isEmployee = user.role?.role_name === 'EMPLOYEE';
            if (!isEmployee) {
                throw new common_1.BadRequestException(`This user already exists but has the "${user.role?.role_name || 'Other'}" role. Only users with the "EMPLOYEE" role can be added to a team.`);
            }
        }
        const isAlreadyMember = team.members.some(member => member.user_id === user.user_id);
        if (isAlreadyMember) {
            throw new common_1.BadRequestException('This user is already a member of your team');
        }
        await this.teamRepo.createQueryBuilder()
            .relation(team_entity_1.Team, 'members')
            .of(team.team_id)
            .add(user.user_id);
        return {
            message: 'Collaborator added to the team successfully',
            user_id: user.user_id
        };
    }
    async removeMemberFromLeaderTeam(leaderId, memberId) {
        const team = await this.teamRepo.findOne({
            where: { team_leader_id: leaderId },
        });
        if (!team)
            throw new common_1.NotFoundException('Aucune équipe trouvée pour ce Team Leader');
        await this.teamRepo.createQueryBuilder()
            .relation(team_entity_1.Team, 'members')
            .of(team.team_id)
            .remove(memberId);
        return { message: 'Collaborateur retiré de l\'équipe avec succès' };
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
        let team = await this.teamRepo.findOne({
            where: { team_leader_id: leaderId },
            relations: [
                'members',
                'members.role',
                'members.certifications'
            ],
        });
        if (!team) {
            const leader = await this.userRepo.findOne({ where: { user_id: leaderId } });
            if (!leader)
                throw new common_1.NotFoundException('Chef d\'équipe non trouvé');
            team = this.teamRepo.create({
                team_name: `Équipe de ${leader.full_name}`,
                team_leader_id: leaderId,
            });
            await this.teamRepo.save(team);
            team.members = [];
        }
        return team;
    }
    async findOne(id) {
        const team = await this.teamRepo.findOne({
            where: { team_id: id },
            relations: ['members', 'members.role'],
        });
        if (!team)
            throw new common_1.NotFoundException('Team not found');
        return team;
    }
    async findMembersByManager(managerId) {
        const team = await this.getMyTeam(managerId);
        return team.members.filter(member => member.active !== false)
            .map(member => ({
            id: member.user_id,
            name: member.full_name,
            email: member.email,
            title: member.title || 'N/A',
            yearsOfExperience: member.years_of_experience || 0,
            certifications: member.certifications || [],
        }));
    }
    async calculateTeamStats(leaderId) {
        const team = await this.getMyTeam(leaderId);
        const members = (team.members || []).filter(member => member.active !== false);
        const allCerts = members.flatMap(m => m.certifications || []);
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
                id: c.certId,
                name: c.certName,
                expiryDate: c.expiryDate instanceof Date ? c.expiryDate.toISOString() : c.expiryDate,
                provider: c.provider,
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
        const team = await this.getMyTeam(leaderId);
        return team.members
            .filter(member => member.active !== false)
            .flatMap(member => (member.certifications || []).map(cert => ({
            ...cert,
            employeeName: member.full_name,
            employeeTitle: member.title || 'N/A',
        })));
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