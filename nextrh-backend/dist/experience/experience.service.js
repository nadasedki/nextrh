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
exports.ExperienceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const experience_entity_1 = require("./entities/experience.entity");
let ExperienceService = class ExperienceService {
    constructor(experienceRepo) {
        this.experienceRepo = experienceRepo;
    }
    async createBulkFromParsedData(expData, userId, cvEntity) {
        if (!expData || expData.length === 0)
            return [];
        const entities = expData.map((exp) => {
            const { startDate, endDate } = this.parsePeriod(exp.period);
            return this.experienceRepo.create({
                user_id: userId,
                company: exp.company || 'Entreprise non spécifiée',
                role: exp.role || 'Poste non spécifié',
                start_date: startDate,
                end_date: endDate,
                description: exp.role,
                cv: cvEntity,
            });
        });
        return await this.experienceRepo.save(entities);
    }
    parsePeriod(period) {
        if (!period)
            return { startDate: null, endDate: null };
        const months = {
            janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
            juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
        };
        const periodLower = period.toLowerCase();
        const years = period.match(/\d{4}/g);
        if (!years)
            return { startDate: null, endDate: null };
        const foundMonths = periodLower.match(new RegExp(Object.keys(months).join('|'), 'g')) || [];
        const startDate = new Date(parseInt(years[0]), foundMonths[0] ? months[foundMonths[0]] : 0, 1);
        let endDate = null;
        if (years.length >= 2) {
            endDate = new Date(parseInt(years[1]), foundMonths[1] ? months[foundMonths[1]] : 11, 1);
        }
        return { startDate, endDate };
    }
    async create(data) {
        const { startDate, endDate, ...rest } = data;
        const newExp = this.experienceRepo.create({
            ...rest,
            start_date: startDate ? new Date(startDate) : null,
            end_date: endDate ? new Date(endDate) : null,
        });
        const saved = await this.experienceRepo.save(newExp);
        return {
            id: saved.id,
            company: saved.company,
            role: saved.role,
            description: saved.description,
            startDate: saved.start_date,
            endDate: saved.end_date,
        };
    }
    async findByUser(userId) {
        const exps = await this.experienceRepo.find({
            where: { user_id: userId },
            order: { start_date: 'DESC' },
        });
        return exps.map(e => ({
            id: e.id,
            company: e.company,
            role: e.role,
            description: e.description,
            startDate: e.start_date,
            endDate: e.end_date,
        }));
    }
    async update(id, userId, data) {
        const exp = await this.experienceRepo.findOne({
            where: { id, user_id: userId }
        });
        if (!exp) {
            throw new Error('Experience not found or unauthorized');
        }
        const { startDate, endDate, ...rest } = data;
        Object.assign(exp, rest);
        if (startDate)
            exp.start_date = new Date(startDate);
        if (endDate)
            exp.end_date = new Date(endDate);
        const saved = await this.experienceRepo.save(exp);
        return {
            id: saved.id,
            company: saved.company,
            role: saved.role,
            description: saved.description,
            startDate: saved.start_date,
            endDate: saved.end_date,
        };
    }
    async remove(id, userId) {
        const exp = await this.experienceRepo.findOne({
            where: { id, user_id: userId }
        });
        if (!exp) {
            throw new Error('Experience not found or unauthorized');
        }
        return await this.experienceRepo.remove(exp);
    }
    async calculateTotalExperience(userId) {
        const experiences = await this.experienceRepo.find({
            where: { user_id: userId },
        });
        let totalMonths = 0;
        const now = new Date();
        for (const exp of experiences) {
            if (!exp.start_date)
                continue;
            const start = new Date(exp.start_date);
            const end = exp.end_date ? new Date(exp.end_date) : now;
            let months = (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth());
            if (end.getDate() < start.getDate()) {
                months -= 1;
            }
            totalMonths += Math.max(0, months);
        }
        return Math.floor(totalMonths / 12);
    }
};
exports.ExperienceService = ExperienceService;
exports.ExperienceService = ExperienceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(experience_entity_1.Experience)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExperienceService);
//# sourceMappingURL=experience.service.js.map