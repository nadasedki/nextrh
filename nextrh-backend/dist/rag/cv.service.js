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
    async getAllUnifiedProfiles() {
        try {
            const profiles = await this.dataSource.query(`
        SELECT 
          c.cv_id,
          c.user_id,
          u.full_name,
          u.title AS profession,
          u.summary,
          u.years_of_experience,
          u.department
        FROM public.cvs c
        INNER JOIN public.users u ON c.user_id = u.user_id
      `);
            for (const profile of profiles) {
                const [certs, edus, projs, exps] = await Promise.all([
                    this.dataSource.query('SELECT * FROM public.certifications WHERE user_id = $1', [profile.user_id]),
                    this.dataSource.query('SELECT * FROM public.education WHERE "cvCvId" = $1', [profile.cv_id]),
                    this.dataSource.query('SELECT * FROM public.projects WHERE user_id = $1', [profile.user_id]),
                    this.dataSource.query('SELECT * FROM public.experiences WHERE user_id = $1', [profile.user_id]),
                ]);
                profile.certifications = certs;
                profile.education = edus;
                profile.projects = projs;
                profile.experiences = exps;
            }
            return profiles;
        }
        catch (err) {
            console.error('Erreur SQL extraction profils:', err.message);
            return [];
        }
    }
    async getAllNames() {
        try {
            const result = await this.dataSource.query('SELECT DISTINCT full_name FROM public.users WHERE full_name IS NOT NULL');
            return result.map(r => r.full_name);
        }
        catch (err) {
            console.error('Erreur SQL lors de la récupération des noms:', err.message);
            return [];
        }
    }
};
exports.CvService = CvService;
exports.CvService = CvService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], CvService);
//# sourceMappingURL=cv.service.js.map