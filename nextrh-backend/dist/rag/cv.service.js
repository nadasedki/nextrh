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
    `);
    }
    async getAllCertifications() {
        return await this.dataSource.query(`
      SELECT * FROM public.certifications
    `);
    }
    async getEducationByCvId(cvId) {
        return await this.dataSource.query(`SELECT * FROM public.education WHERE "cvCvId" = $1`, [cvId]);
    }
    async getProjectsByCvId(cvId) {
        return await this.dataSource.query(`SELECT * FROM public.projects WHERE "cvCvId" = $1`, [cvId]);
    }
    async getExperiencesByCvId(cvId) {
        return await this.dataSource.query(`SELECT * FROM public.experiences WHERE "cvCvId" = $1`, [cvId]);
    }
    async getAllUnifiedProfiles() {
        const cvs = await this.getAllCVs();
        const certs = await this.getAllCertifications();
        const profiles = [];
        for (const cv of cvs) {
            const identityKey = (cv.full_name || '').toLowerCase();
            const profileCerts = certs.filter(c => (c.certificate_holder || '').toLowerCase() === identityKey);
            const education = await this.getEducationByCvId(cv.cv_id);
            const projects = await this.getProjectsByCvId(cv.cv_id);
            const experiences = await this.getExperiencesByCvId(cv.cv_id);
            profiles.push({
                ...cv,
                identity_key: identityKey,
                certifications: profileCerts,
                education,
                projects,
                experiences,
            });
        }
        return profiles;
    }
    async getAllNames() {
        const result = await this.dataSource.query(`
      SELECT DISTINCT full_name FROM public.cvs WHERE full_name IS NOT NULL
    `);
        return result.map(r => r.full_name);
    }
    async getCertificationsByCvId(cvId) {
        try {
            const result = await this.dataSource.query(`
      SELECT *
      FROM public.certifications
      WHERE "cvCvId" = $1
      `, [cvId]);
            return result;
        }
        catch (err) {
            console.error('Erreur SQL certifications by holder:', err.message);
            return [];
        }
    }
    async getCertificationWithCvContext(certId) {
        const [result] = await this.dataSource.query(`
    SELECT c.*, cv.full_name, cv.profession, cv.cv_id
    FROM certifications c
    JOIN cvs cv ON c."cvCvId" = cv.cv_id
    WHERE c.cert_id = $1
  `, [certId]);
        return result;
    }
};
exports.CvService = CvService;
exports.CvService = CvService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], CvService);
//# sourceMappingURL=cv.service.js.map