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
var IndexingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const cv_service_1 = require("../cv.service");
const embedding_service_1 = require("../embedding/embedding.service");
const vector_service_1 = require("../vector/vector.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let IndexingService = IndexingService_1 = class IndexingService {
    constructor(cvService, embeddingService, vectorService) {
        this.cvService = cvService;
        this.embeddingService = embeddingService;
        this.vectorService = vectorService;
        this.logger = new common_1.Logger(IndexingService_1.name);
    }
    async handleCertificationSaved(payload) {
        const certId = payload?.certId;
        if (!certId) {
            this.logger.error(`❌ Impossible de ré-indexer : 'certId' est introuvable dans le payload de l'événement.`);
            return;
        }
        this.logger.log(`🔄 Ré-indexation de la certification #${certId}`);
        const cert = await this.cvService.getCertificationWithCvContext(certId);
        if (!cert)
            return;
        await this.vectorService.deleteByEntityId(certId, 'certification');
        const identityHeader = `CANDIDAT: ${cert.full_name}\nPROFESSION: ${cert.profession || 'N/A'}\n`;
        const text = `${identityHeader}CERTIFICATION: ${cert.cert_name}\nORGANISME: ${cert.provider}\nDATE: ${cert.issue_date}`;
        const point = await this.createVectorPoint(text, cert, 'certification', certId);
        await this.vectorService.insertBatch([point]);
    }
    async handleCertificationDeleted(payload) {
        this.logger.log(`🗑️ Suppression du vecteur pour la certification #${payload.certId}`);
        await this.vectorService.deleteByEntityId(payload.certId, 'certification');
    }
    async indexAllCVs() {
        this.logger.log('🚀 Démarrage de l\'indexation globale des CVs...');
        await this.vectorService.recreateCollection();
        this.logger.log('recreated the collection');
        const cvs = await this.cvService.getAllCVs();
        let totalPointsCount = 0;
        for (const cv of cvs) {
            try {
                if (!cv.cv_id)
                    continue;
                const points = [];
                const identityHeader = `CANDIDAT: ${cv.full_name}\nPROFESSION: ${cv.profession || 'N/A'}\n`;
                const profileText = `${identityHeader}INFOS CONTACT & RÉSUMÉ:\nEmail: ${cv.email}\nAdresse: ${cv.address}\nCompétences: ${cv.skills}`;
                points.push(await this.createVectorPoint(profileText, cv, 'profile', cv.cv_id));
                const certifications = await this.cvService.getCertificationsByCvId(cv.cv_id);
                for (const cert of certifications) {
                    const text = `${identityHeader}CERTIFICATION: ${cert.cert_name}\nORGANISME: ${cert.provider}\nOBTENUE LE: ${cert.issue_date || 'N/A'}`;
                    points.push(await this.createVectorPoint(text, cv, 'certification', cert.certId));
                }
                const education = await this.cvService.getEducationByCvId(cv.cv_id);
                for (const edu of education) {
                    const text = `${identityHeader}FORMATION: ${edu.degree}\nINSTITUTION: ${edu.institution}\nDOMAINE: ${edu.field_of_study}\nPÉRIODE: ${edu.start_year}-${edu.end_year}`;
                    points.push(await this.createVectorPoint(text, cv, 'education', edu.education_id));
                }
                const projects = await this.cvService.getProjectsByCvId(cv.cv_id);
                for (const proj of projects) {
                    const text = `${identityHeader}PROJET: ${proj.name}\nCLIENT: ${proj.client}\nDATES: ${proj.start_date}-${proj.end_date}\nDESCRIPTION: ${proj.description}\nTECHNO: ${proj.technologies}`;
                    points.push(await this.createVectorPoint(text, cv, 'project', proj.id));
                }
                const experiences = await this.cvService.getExperiencesByCvId(cv.cv_id);
                for (const exp of experiences) {
                    const text = `${identityHeader}EXPÉRIENCE: ${exp.role}\nENTREPRISE: ${exp.company}\nDATES: ${exp.start_date}-${exp.end_date}\nMISSIONS: ${exp.description}`;
                    points.push(await this.createVectorPoint(text, cv, 'experience', exp.id));
                }
                if (points.length > 0) {
                    await this.vectorService.insertBatch(points);
                    totalPointsCount += points.length;
                    this.logger.log(`✅ Indexé : ${cv.full_name} (${points.length} vecteurs)`);
                }
            }
            catch (err) {
                this.logger.error(`❌ Erreur lors de l'indexation du CV #${cv.cv_id}: ${err.message}`);
            }
        }
        this.logger.log(`🏁 Indexation terminée. Total : ${cvs.length} CVs, ${totalPointsCount} points vectoriels.`);
        return { totalCVs: cvs.length, totalPoints: totalPointsCount };
    }
    async createVectorPoint(text, cv, type, entityId) {
        const vector = await this.embeddingService.embed(text);
        const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
        const deterministicId = (0, uuid_1.v5)(`${type}-${entityId}`, MY_NAMESPACE);
        return {
            id: deterministicId,
            vector: vector,
            payload: {
                text: text,
                type: type,
                cv_id: cv.cv_id,
                entity_id: entityId,
                full_name: cv.full_name,
                source_table: this.mapTypeToTable(type),
                indexed_at: new Date().toISOString()
            },
        };
    }
    mapTypeToTable(type) {
        const mapping = {
            profile: 'cvs',
            certification: 'certifications',
            project: 'projects',
            education: 'education',
            experience: 'experiences'
        };
        return mapping[type] || 'unknown';
    }
};
exports.IndexingService = IndexingService;
__decorate([
    (0, event_emitter_1.OnEvent)('certification.saved'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingService.prototype, "handleCertificationSaved", null);
__decorate([
    (0, event_emitter_1.OnEvent)('certification.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IndexingService.prototype, "handleCertificationDeleted", null);
exports.IndexingService = IndexingService = IndexingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_service_1.CvService,
        embedding_service_1.EmbeddingService,
        vector_service_1.VectorService])
], IndexingService);
//# sourceMappingURL=indexing.service.js.map