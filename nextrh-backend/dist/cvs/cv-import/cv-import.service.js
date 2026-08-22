"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CvImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvImportService = void 0;
const common_1 = require("@nestjs/common");
const cv_extraction_orchestrator_service_1 = require("../../cv-parser/cv-extraction-orchestrator.service");
const cv_service_1 = require("../cv.service");
const education_service_1 = require("../../education/education.service");
const certifications_service_1 = require("../../certifications/services/certifications.service");
const project_service_1 = require("../../project/project.service");
const experience_service_1 = require("../../experience/experience.service");
const users_service_1 = require("../../users/users.service");
const scoring_service_1 = require("../../scoring/scoring.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let CvImportService = CvImportService_1 = class CvImportService {
    constructor(configService, cvService, educationService, certificationsService, projectsService, usersService, experienceService, scoringService, cvExtractionOrchestrator, eventEmitter) {
        this.configService = configService;
        this.cvService = cvService;
        this.educationService = educationService;
        this.certificationsService = certificationsService;
        this.projectsService = projectsService;
        this.usersService = usersService;
        this.experienceService = experienceService;
        this.scoringService = scoringService;
        this.cvExtractionOrchestrator = cvExtractionOrchestrator;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(CvImportService_1.name);
        const configuredPath = this.configService.get('UPLOAD_DESTINATION') || './uploads/cvs';
        this.uploadDir = path.isAbsolute(configuredPath)
            ? configuredPath
            : path.join(process.cwd(), configuredPath);
        this.logger.log(`CV Upload directory initialized at: ${this.uploadDir}`);
    }
    async saveFileToDisk(fileBuffer, employeeId, originalName) {
        await fs.mkdir(this.uploadDir, { recursive: true });
        const ext = path.extname(originalName) || '.pdf';
        const fileName = `cv-${employeeId}-${Date.now()}${ext}`;
        const fullPath = path.join(this.uploadDir, fileName);
        await fs.writeFile(fullPath, fileBuffer);
        return `uploads/cvs/${fileName}`;
    }
    async uploadAndSaveCv(fileBuffer, employeeId, originalName) {
        this.logger.log(` Starting execution pipeline for employee ID: ${employeeId}`);
        const parseResult = await this.cvExtractionOrchestrator.parseCv(fileBuffer);
        const result = parseResult.data;
        const existingCv = await this.cvService.findByUserId(employeeId);
        if (existingCv) {
            this.logger.log(`Existing CV found (ID: ${existingCv.cv_id}) for employee ${employeeId}. Deleting old profile records...`);
            await this.cvService.remove(existingCv.cv_id, employeeId);
        }
        this.logger.log(` Saving extracted identity details to database...`);
        const savedFilePath = await this.saveFileToDisk(fileBuffer, employeeId, originalName);
        const savedCv = await this.cvService.saveIdentityCv(employeeId, savedFilePath, result);
        await this.usersService.updateProfileFromCv(employeeId, savedCv.full_name, savedCv.profession);
        await this.educationService.createParsedEducation(result.education, employeeId, savedCv);
        await this.certificationsService.createBulkFromParsedData(result.certifications, employeeId, savedFilePath, savedCv);
        await this.projectsService.createBulkFromParsedData(result.projects, employeeId, savedCv);
        await this.experienceService.createBulkFromParsedData(result.experience, employeeId, savedCv);
        const years = await this.experienceService.calculateTotalExperience(employeeId);
        await this.usersService.updateYearsOfExperience(employeeId, years);
        this.logger.log(` Re-calculating scoring match vectors...`);
        await this.scoringService.calculateAndSaveScore(employeeId);
        this.eventEmitter.emit('cv.saved', {
            entityId: savedCv.cv_id,
            userId: employeeId,
        });
        this.logger.log(` Event 'cv.saved' dispatched successfully. Background indexing started.`);
        return {
            status: 'success',
            cvId: savedCv.cv_id,
            metrics: parseResult.execution_metrics,
            data: result
        };
    }
};
exports.CvImportService = CvImportService;
exports.CvImportService = CvImportService = CvImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        cv_service_1.CvService,
        education_service_1.EducationService,
        certifications_service_1.CertificationsService,
        project_service_1.ProjectService,
        users_service_1.UsersService,
        experience_service_1.ExperienceService,
        scoring_service_1.ScoringService,
        cv_extraction_orchestrator_service_1.CvExtractionOrchestrator,
        event_emitter_1.EventEmitter2])
], CvImportService);
//# sourceMappingURL=cv-import.service.js.map