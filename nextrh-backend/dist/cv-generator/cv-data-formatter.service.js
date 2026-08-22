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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvDataFormatterService = void 0;
const common_1 = require("@nestjs/common");
const employeeProfile_service_1 = require("../Employee/employeeProfile.service");
let CvDataFormatterService = class CvDataFormatterService {
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    async getFormattedCandidateData(userId) {
        const profile = await this.employeeService.getCVByUserId(userId);
        if (!profile) {
            throw new common_1.BadRequestException(`No profile found for user #${userId}`);
        }
        const [eduRaw, expRaw, certsRaw, projectsRaw, trainingsRaw] = await Promise.all([
            this.employeeService.getEducationByUserId(userId),
            this.employeeService.getExperiencesByUserId(userId),
            this.employeeService.getCertificationsByUserId(userId),
            this.employeeService.getProjectsByUserId(userId),
            this.employeeService.getTrainingsByUserId(userId),
        ]);
        return this.format(profile, eduRaw, expRaw, certsRaw, projectsRaw, trainingsRaw);
    }
    format(profile, eduRaw, expRaw, certsRaw, projectsRaw, trainingsRaw) {
        return {
            full_name: profile.full_name,
            profession: profile.profession,
            email: profile.email,
            phone: profile.phone || '',
            address: profile.address,
            skills: profile.skills ? profile.skills.split(',').map((s) => s.trim()) : [],
            years_of_experience: profile.years_of_experience || '',
            education: eduRaw.map(edu => ({
                degree: edu.degree || edu.diploma || '',
                institution: edu.institution || edu.school || '',
                start_year: edu.start_year || '',
                end_year: edu.end_year || '',
            })),
            experiences: expRaw.map(exp => ({
                role: exp.role || exp.title || '',
                company: exp.company || exp.enterprise || '',
                period: this.formatPeriod(exp.start_date, exp.end_date || exp.period),
                description: exp.description || '',
            })),
            certifications: certsRaw.map(cert => ({
                cert_name: cert.certification_name || cert.cert_name || cert.name || '',
                provider: cert.provider || '',
                date: this.formatDate(cert.completion_date || cert.date),
            })),
            projects: projectsRaw.map(proj => ({
                client: proj.client || proj.project_name || '',
                year: this.formatPeriodYearsOnly(proj.start_date, proj.end_date || proj.year),
                description: proj.description || '',
            })),
            trainings: trainingsRaw.map(t => ({
                training_name: t.training_name || '',
                provider: t.provider || '',
                duration: t.duration || '',
            })),
        };
    }
    formatDate(dateInput) {
        if (!dateInput)
            return '';
        const date = new Date(dateInput);
        if (isNaN(date.getTime()))
            return String(dateInput);
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    formatPeriod(startInput, endInput) {
        const start = this.formatDate(startInput);
        const end = this.formatDate(endInput);
        if (start && end)
            return `${start} - ${end}`;
        if (start)
            return start;
        if (end)
            return end;
        return '';
    }
    formatDateYearOnly(dateInput) {
        if (!dateInput)
            return '';
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            const match = String(dateInput).match(/\d{4}/);
            return match ? match[0] : String(dateInput);
        }
        return `${date.getFullYear()}`;
    }
    formatPeriodYearsOnly(startInput, endInput) {
        const start = this.formatDateYearOnly(startInput);
        const end = this.formatDateYearOnly(endInput);
        if (start && end) {
            return start === end ? start : `${start} - ${end}`;
        }
        if (start)
            return start;
        if (end)
            return end;
        return '';
    }
};
exports.CvDataFormatterService = CvDataFormatterService;
exports.CvDataFormatterService = CvDataFormatterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employeeProfile_service_1.EmployeeProfileService])
], CvDataFormatterService);
//# sourceMappingURL=cv-data-formatter.service.js.map