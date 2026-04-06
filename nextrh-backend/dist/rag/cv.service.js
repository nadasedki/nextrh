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
        try {
            const cvs = await this.dataSource.query('SELECT * FROM cvs');
            for (const cv of cvs) {
                const [certs, edus, projs, exps] = await Promise.all([
                    this.dataSource.query('SELECT * FROM certifications WHERE "cvCvId"=$1', [cv.cv_id]),
                    this.dataSource.query('SELECT * FROM education WHERE "cvCvId"=$1', [cv.cv_id]),
                    this.dataSource.query('SELECT * FROM projects WHERE "cvCvId"=$1', [cv.cv_id]),
                    this.dataSource.query('SELECT * FROM experiences WHERE "cvCvId"=$1', [cv.cv_id]),
                ]);
                cv.certifications = certs;
                cv.education = edus;
                cv.projects = projs;
                cv.experiences = exps;
                cv.fullText = this.buildText(cv);
            }
            return cvs;
        }
        catch (err) {
            console.error('Erreur SQL:', err.message);
            return [];
        }
    }
    buildText(cv) {
        if (!cv)
            return '';
        const certs = new Set(cv.certifications?.map(c => `- ${c.cert_name} (${c.provider})`));
        const edus = new Set(cv.education?.map(e => `- ${e.degree} en ${e.field_of_study} à ${e.institution}`));
        const projs = new Set(cv.projects?.map(p => `- ${p.name}: ${p.description}`));
        const exps = new Set(cv.experiences?.map(exp => `- ${exp.role} chez ${exp.company}: ${exp.description}`));
        let text = `IDENTITÉ: ${cv.full_name}\nPROFESSION: ${cv.profession || 'N/A'}\n`;
        text += `RÉSUMÉ: ${cv.summary || ''}\n\n`;
        if (certs.size > 0)
            text += `CERTIFICATIONS:\n${Array.from(certs).join('\n')}\n\n`;
        if (edus.size > 0)
            text += `ÉDUCATION:\n${Array.from(edus).join('\n')}\n\n`;
        if (projs.size > 0)
            text += `PROJETS:\n${Array.from(projs).join('\n')}\n\n`;
        if (exps.size > 0)
            text += `EXPÉRIENCES:\n${Array.from(exps).join('\n')}\n\n`;
        return text.trim();
    }
    chunkText(text, chunkSize = 800) {
        if (!text)
            return [];
        const paragraphs = text.split('\n\n');
        const chunks = [];
        let currentChunk = "";
        for (const para of paragraphs) {
            if ((currentChunk.length + para.length) > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = para;
            }
            else {
                currentChunk += "\n\n" + para;
            }
        }
        if (currentChunk)
            chunks.push(currentChunk.trim());
        return chunks;
    }
    async getAllNames() {
        try {
            const result = await this.dataSource.query('SELECT DISTINCT full_name FROM cvs WHERE full_name IS NOT NULL');
            return result.map(r => r.full_name);
        }
        catch (err) {
            console.error('Erreur lors de la récupération des noms:', err.message);
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