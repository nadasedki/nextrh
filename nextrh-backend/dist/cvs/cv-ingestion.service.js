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
var CvIngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvIngestionService = void 0;
const common_1 = require("@nestjs/common");
const cv_extraction_orchestrator_service_1 = require("../cv-parser/cv-extraction-orchestrator.service");
const cv_service_1 = require("./cv.service");
const education_service_1 = require("../education/education.service");
const certifications_service_1 = require("../certifications/services/certifications.service");
const project_service_1 = require("../project/project.service");
const experience_service_1 = require("../experience/experience.service");
const users_service_1 = require("../users/users.service");
const scoring_service_1 = require("../scoring/scoring.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let CvIngestionService = CvIngestionService_1 = class CvIngestionService {
    constructor(cvService, educationService, certificationsService, projectsService, usersService, experienceService, scoringService, cvExtractionOrchestrator, eventEmitter) {
        this.cvService = cvService;
        this.educationService = educationService;
        this.certificationsService = certificationsService;
        this.projectsService = projectsService;
        this.usersService = usersService;
        this.experienceService = experienceService;
        this.scoringService = scoringService;
        this.cvExtractionOrchestrator = cvExtractionOrchestrator;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(CvIngestionService_1.name);
    }
    async ingestCv(fileBuffer, employeeId, originalName, savedFilePath) {
        this.logger.log(`[Worker Pipeline] Starting AI extraction for Employee #${employeeId}...`);
        const parseResult = await this.cvExtractionOrchestrator.parseCv(fileBuffer);
        const result = parseResult.data;
        const existingCv = await this.cvService.findByUserId(employeeId);
        if (existingCv) {
            this.logger.log(`Replacing previous CV #${existingCv.cv_id} for Employee #${employeeId}`);
            await this.cvService.remove(existingCv.cv_id, employeeId);
        }
        this.logger.log(`Persisting extracted identity details to database...`);
        const savedCv = await this.cvService.saveIdentityCv(employeeId, savedFilePath, result);
        await this.usersService.updateProfileFromCv(employeeId, savedCv.full_name, savedCv.profession);
        await this.educationService.createParsedEducation(result.education, employeeId, savedCv);
        await this.certificationsService.createBulkFromParsedData(result.certifications, employeeId, savedFilePath, savedCv);
        await this.projectsService.createBulkFromParsedData(result.projects, employeeId, savedCv);
        await this.experienceService.createBulkFromParsedData(result.experience, employeeId, savedCv);
        const years = await this.experienceService.calculateTotalExperience(employeeId);
        await this.usersService.updateYearsOfExperience(employeeId, years);
        this.logger.log(`Re-calculating scoring match vectors for User #${employeeId}...`);
        await this.scoringService.calculateAndSaveScore(employeeId);
        this.eventEmitter.emit('cv.saved', {
            entityId: savedCv.cv_id,
            userId: employeeId,
        });
        this.logger.log(`[Worker Pipeline] CV #${savedCv.cv_id} successfully parsed and indexed!`);
        return {
            status: 'success',
            cvId: savedCv.cv_id,
            filePath: savedFilePath,
            metrics: parseResult.execution_metrics,
            data: result,
        };
    }
};
exports.CvIngestionService = CvIngestionService;
exports.CvIngestionService = CvIngestionService = CvIngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_service_1.CvService,
        education_service_1.EducationService,
        certifications_service_1.CertificationsService,
        project_service_1.ProjectService,
        users_service_1.UsersService,
        experience_service_1.ExperienceService,
        scoring_service_1.ScoringService,
        cv_extraction_orchestrator_service_1.CvExtractionOrchestrator,
        event_emitter_1.EventEmitter2])
], CvIngestionService);
//# sourceMappingURL=cv-ingestion.service.js.map