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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const project_entity_1 = require("../project/entities/project.entity");
const training_entity_1 = require("../training/entities/training.entity");
const certification_entity_1 = require("../certifications/entities/certification.entity");
const cv_entity_1 = require("../cvs/entities/cv.entity");
const user_skill_entity_1 = require("../skill/entities/user-skill.entity");
const team_entity_1 = require("../users/entities/team.entity");
let EmployeesService = class EmployeesService {
    constructor(userRepository, projectRepository, trainingRepository, certificationRepository, cvRepository, userSkillRepository, certRepository, teamRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.trainingRepository = trainingRepository;
        this.certificationRepository = certificationRepository;
        this.cvRepository = cvRepository;
        this.userSkillRepository = userSkillRepository;
        this.certRepository = certRepository;
        this.teamRepository = teamRepository;
    }
    async getDashboardData(userId) {
        const user = await this.userRepository.findOne({ where: { user_id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const [projects, trainings, certifications, latestCv] = await Promise.all([
            this.projectRepository.find({ where: { user_id: userId } }),
            this.trainingRepository.find({ where: { user_id: userId } }),
            this.certificationRepository.find({ where: { userId: userId } }),
            this.cvRepository.findOne({
                where: { user_id: userId },
                order: { last_updated: 'DESC' }
            }),
        ]);
        return {
            title: user.title || 'No Title',
            yearsOfExperience: user.years_of_experience || 0,
            certifications: certifications.map(c => ({
                id: c.certId,
                name: c.certName,
                issuer: c.provider,
                status: c.status
            })),
            trainings: trainings.map(t => ({
                id: t.training_id,
                name: t.training_name
            })),
            projects: projects.map(p => ({
                id: p.id,
                name: p.name
            })),
            cvLastUpdated: latestCv ? latestCv.last_updated.toISOString().split('T')[0] : 'Never'
        };
    }
    async getFullEmployeeCv(userId) {
        const user = await this.userRepository.findOne({
            where: { user_id: userId },
            relations: ['teams']
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const [projects, trainings, certifications, userSkills] = await Promise.all([
            this.projectRepository.find({ where: { user_id: userId } }),
            this.trainingRepository.find({ where: { user_id: userId } }),
            this.certificationRepository.find({ where: { userId: userId } }),
            this.userSkillRepository.find({
                where: { user_id: userId },
                relations: ['skill']
            }),
        ]);
        return {
            name: user.full_name,
            title: user.title,
            email: user.email,
            department: user.department || 'N/A',
            summary: user.summary || '',
            skills: userSkills.map(us => us.skill.skill_name),
            projects: projects.map(p => ({
                id: p.id,
                name: p.name,
                role: p.role,
                client: p.client,
                startDate: p.start_date,
                endDate: p.end_date,
                description: p.description,
                technologies: p.technologies || []
            })),
            certifications: certifications.map(c => ({
                id: c.certId,
                name: c.certName,
                issuer: c.provider,
                expirationDate: c.expiryDate,
                status: c.status
            })),
            trainings: trainings.map(t => ({
                id: t.training_id,
                name: t.training_name,
                provider: t.provider,
                completionDate: t.completion_date,
                duration: t.duration
            })),
            education: [],
        };
    }
    async findAllEmployees() {
        return this.userRepository.find({
            relations: ['userSkills', 'userSkills.skill', 'certifications'],
            where: { active: true }
        });
    }
    async searchEmployees(query) {
        return this.userRepository.find({
            where: [
                { full_name: (0, typeorm_2.Like)(`%${query}%`) },
                { title: (0, typeorm_2.Like)(`%${query}%`) },
            ],
            relations: ['userSkills', 'userSkills.skill', 'certifications'],
        });
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { user_id: id },
            relations: [
                'userSkills',
                'userSkills.skill',
                'certifications',
                'trainings',
                'projects'
            ],
        });
        if (!user) {
            throw new common_1.NotFoundException(`Member not found`);
        }
        return user;
    }
    async calculateDashboardStats() {
        const totalEmployees = await this.userRepository.count({ where: { active: true } });
        const totalCertifications = await this.certRepository.count();
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const expiringThisMonth = await this.certRepository.count({
            where: {
                expiryDate: (0, typeorm_2.Between)(now, endOfMonth),
            },
        });
        const totalTeams = await this.teamRepository.count();
        const certs = await this.certRepository.find();
        const certStatus = certs.reduce((acc, cert) => {
            acc[cert.status] = (acc[cert.status] || 0) + 1;
            return acc;
        }, { active: 0, expiringSoon: 0, expired: 0 });
        const providerStats = certs.reduce((acc, cert) => {
            acc[cert.provider] = (acc[cert.provider] || 0) + 1;
            return acc;
        }, {});
        const certificationsByProvider = Object.entries(providerStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
        return {
            totalEmployees,
            totalCertifications,
            expiringThisMonth,
            totalTeams,
            certificationStatus: certStatus,
            certificationsByProvider,
        };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(2, (0, typeorm_1.InjectRepository)(training_entity_1.Training)),
    __param(3, (0, typeorm_1.InjectRepository)(certification_entity_1.Certification)),
    __param(4, (0, typeorm_1.InjectRepository)(cv_entity_1.Cv)),
    __param(5, (0, typeorm_1.InjectRepository)(user_skill_entity_1.UserSkill)),
    __param(6, (0, typeorm_1.InjectRepository)(certification_entity_1.Certification)),
    __param(7, (0, typeorm_1.InjectRepository)(team_entity_1.Team)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map