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
const cv_entity_1 = require("./entities/cv.entity");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
let CvService = class CvService {
    constructor(cvRepository, dataSource) {
        this.cvRepository = cvRepository;
        this.dataSource = dataSource;
    }
    async saveIdentityCv(userId, filePath, cvJson) {
        const cv = this.cvRepository.create({
            user_id: userId,
            file_path: filePath,
            format: 'pdf',
            generated: true,
            full_name: cvJson.contact?.name,
            profession: cvJson.contact?.profession,
            email: cvJson.contact?.email,
            phone: cvJson.contact?.phone,
            fax: cvJson.contact?.fax,
            address: cvJson.contact?.address,
            skills: cvJson.skills || [],
        });
        return await this.cvRepository.save(cv);
    }
    async getFullCvData(cvId) {
        const [cv] = await this.dataSource.query('SELECT * FROM cvs WHERE cv_id = $1', [cvId]);
        if (!cv)
            throw new common_1.NotFoundException('CV non trouvé');
        const [certs, edus, projs, exps] = await Promise.all([
            this.dataSource.query('SELECT cert_name, provider, issue_date, expiry_date FROM certifications WHERE "cvCvId"=$1 ORDER BY issue_date DESC', [cvId]),
            this.dataSource.query('SELECT degree, institution,  start_year, end_year FROM education WHERE "cvCvId"=$1 ', [cvId]),
            this.dataSource.query('SELECT name, client, role, description, end_date,start_date FROM projects WHERE "cvCvId"=$1 ORDER BY end_date DESC', [cvId]),
            this.dataSource.query('SELECT company, role, start_date, end_date, description FROM experiences WHERE "cvCvId"=$1 ORDER BY end_date DESC', [cvId]),
        ]);
        let skillsArray = [];
        if (cv.skills) {
            skillsArray = String(cv.skills)
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }
        return {
            ...cv,
            phone: cv.phone || '',
            address: cv.address || '',
            certifications: certs,
            education: edus,
            projects: projs.map(p => ({ ...p, year: p.end_date ? new Date(p.end_date).getFullYear() : '' })),
            experiences: exps.map(exp => ({
                ...exp,
                start_date: exp.start_date
                    ? (0, date_fns_1.format)(new Date(exp.start_date), 'MMMM yyyy', { locale: locale_1.fr })
                    : 'Présent',
                end_date: exp.end_date
                    ? (0, date_fns_1.format)(new Date(exp.end_date), 'MMMM yyyy', { locale: locale_1.fr })
                    : 'Présent',
            })),
            skills: skillsArray,
        };
    }
};
exports.CvService = CvService;
exports.CvService = CvService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cv_entity_1.Cv)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], CvService);
//# sourceMappingURL=cv.service.js.map