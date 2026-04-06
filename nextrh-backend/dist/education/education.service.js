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
exports.EducationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const education_entity_1 = require("./entities/education.entity");
const typeorm_2 = require("typeorm");
let EducationService = class EducationService {
    constructor(educationRepository) {
        this.educationRepository = educationRepository;
    }
    async create(data) {
        const education = this.educationRepository.create(data);
        return this.educationRepository.save(education);
    }
    extractYearsFromPeriod(period) {
        if (!period)
            return { startYear: null, endYear: null };
        const years = period.match(/\d{4}/g);
        if (!years)
            return { startYear: null, endYear: null };
        if (years.length === 1) {
            return { startYear: null, endYear: parseInt(years[0]) };
        }
        return {
            startYear: parseInt(years[0]),
            endYear: parseInt(years[1]),
        };
    }
    async createParsedEducation(educationData, userId, cvEntity) {
        if (!educationData || educationData.length === 0)
            return [];
        const educationEntities = educationData.map((edu) => {
            const { startYear, endYear } = this.extractYearsFromPeriod(edu.year);
            return this.educationRepository.create({
                user_id: userId,
                institution: edu.institution || 'Inconnu',
                degree: edu.degree || 'Diplôme non spécifié',
                field_of_study: null,
                start_year: startYear,
                end_year: endYear,
                cv: cvEntity,
            });
        });
        return await this.educationRepository.save(educationEntities);
    }
};
exports.EducationService = EducationService;
exports.EducationService = EducationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(education_entity_1.Education)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EducationService);
//# sourceMappingURL=education.service.js.map