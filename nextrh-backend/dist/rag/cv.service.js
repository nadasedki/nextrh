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
exports.CvService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let CvService = class CvService {
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
        skills
      FROM public.cvs
      WHERE user_id IS NOT NULL
    `);
    }
    async getCVByUserId(userId) {
        const rows = await this.dataSource.query(`
      SELECT 
        cv_id,
        user_id,
        full_name,
        profession,
        email,
        phone,
        fax,
        address,
        skills
      FROM public.cvs
      WHERE user_id = $1
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
    async getCertificationWithCvContext(certId) {
        const [result] = await this.dataSource.query(`
      SELECT c.*, cv.full_name, cv.profession, cv.user_id, cv.cv_id
      FROM certifications c
      JOIN cvs cv ON c."cvCvId" = cv.cv_id
      WHERE c.cert_id = $1
    `, [certId]);
        return result;
    }
    async getAllNames() {
        const result = await this.dataSource.query(`
      SELECT DISTINCT full_name FROM public.cvs WHERE full_name IS NOT NULL
    `);
        return result.map(r => r.full_name);
    }
};
exports.CvService = CvService;
exports.CvService = CvService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], CvService);
//# sourceMappingURL=cv.service.js.map