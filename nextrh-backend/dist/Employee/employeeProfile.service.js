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
exports.EmployeeProfileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let EmployeeProfileService = class EmployeeProfileService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getAllCVs() {
        return await this.dataSource.query(`
      SELECT 
        cv_id,
        user_id,
        full_name,
        profession,
        email,
        phone,
        fax,
        address,
        skills,
        active_generation
      FROM public.cvs
      WHERE user_id IS NOT NULL
    `);
    }
    async getCVByUserId(userId) {
        const rows = await this.dataSource.query(`
      SELECT 
        cv.cv_id,
        cv.user_id,
        cv.full_name,
        cv.profession,
        cv.email,
        cv.phone,
        cv.fax,
        cv.address,
        cv.skills,
        cv.active_generation,
        u.years_of_experience -- Joined from public.users table
      FROM public.cvs cv
      LEFT JOIN public.users u ON cv.user_id = u.user_id
      WHERE cv.user_id = $1
      LIMIT 1
    `, [userId]);
        return rows.length > 0 ? rows[0] : null;
    }
    async getAllCertifications() {
        return await this.dataSource.query(`
      SELECT * FROM public.certifications
    `);
    }
    async getEducationByUserId(userId) {
        return await this.dataSource.query(`SELECT e.* FROM public.educations e 
       JOIN public.cvs cv ON e."cvCvId" = cv.cv_id 
       WHERE cv.user_id = $1`, [userId]);
    }
    async getProjectsByUserId(userId) {
        return await this.dataSource.query(`SELECT p.* FROM public.projects p 
       JOIN public.cvs cv ON p."cvCvId" = cv.cv_id 
       WHERE cv.user_id = $1`, [userId]);
    }
    async getExperiencesByUserId(userId) {
        return await this.dataSource.query(`SELECT e.* FROM public.experiences e 
       JOIN public.cvs cv ON e."cvCvId" = cv.cv_id 
       WHERE cv.user_id = $1`, [userId]);
    }
    async getCertificationsByUserId(userId) {
        return await this.dataSource.query(`SELECT c.* FROM public.certifications c
       JOIN public.cvs cv ON c."cvCvId" = cv.cv_id
       WHERE cv.user_id = $1`, [userId]);
    }
    async getTrainingsByUserId(userId) {
        return await this.dataSource.query(`
      SELECT 
        training_id,
        user_id,
        training_name,
        provider,
        description,
        completion_date,
        duration
      FROM public.training_sessions
      WHERE user_id = $1
    `, [userId]);
    }
};
exports.EmployeeProfileService = EmployeeProfileService;
exports.EmployeeProfileService = EmployeeProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], EmployeeProfileService);
//# sourceMappingURL=employeeProfile.service.js.map