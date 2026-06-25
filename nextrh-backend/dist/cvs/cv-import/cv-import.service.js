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
var CvImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvImportService = void 0;
const common_1 = require("@nestjs/common");
const cv_parser_facade_1 = require("../../document-manager/services/cv-parser.facade");
const cv_service_1 = require("../cv.service");
const education_service_1 = require("../../education/education.service");
const certifications_service_1 = require("../../certifications/services/certifications.service");
const project_service_1 = require("../../project/project.service");
const experience_service_1 = require("../../experience/experience.service");
const users_service_1 = require("../../users/users.service");
const scoring_service_1 = require("../../scoring/scoring.service");
let CvImportService = CvImportService_1 = class CvImportService {
    constructor(cvParserFacade, cvService, educationService, certificationsService, projectsService, usersService, experienceService, scoringService) {
        this.cvParserFacade = cvParserFacade;
        this.cvService = cvService;
        this.educationService = educationService;
        this.certificationsService = certificationsService;
        this.projectsService = projectsService;
        this.usersService = usersService;
        this.experienceService = experienceService;
        this.scoringService = scoringService;
        this.logger = new common_1.Logger(CvImportService_1.name);
    }
    async uploadAndSaveCv(fileBuffer, employeeId, originalName) {
        this.logger.log(` Starting execution pipeline for employee ID: ${employeeId}`);
        const parseResult = await this.cvParserFacade.parseCv(fileBuffer);
        const result = parseResult.data;
        this.logger.log(` Saving extracted identity details to database...`);
        const savedCv = await this.cvService.saveIdentityCv(employeeId, originalName, result);
        await this.usersService.updateProfileFromCv(employeeId, savedCv.full_name, savedCv.profession);
        await this.educationService.createParsedEducation(result.education, employeeId, savedCv);
        await this.certificationsService.createBulkFromParsedData(result.certifications, employeeId, originalName, savedCv);
        await this.projectsService.createBulkFromParsedData(result.projects, employeeId, savedCv);
        await this.experienceService.createBulkFromParsedData(result.experience, employeeId, savedCv);
        const years = await this.experienceService.calculateTotalExperience(employeeId);
        await this.usersService.updateYearsOfExperience(employeeId, years);
        this.logger.log(` Re-calculating scoring match vectors...`);
        await this.scoringService.calculateAndSaveScore(employeeId);
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
    __metadata("design:paramtypes", [cv_parser_facade_1.CvParserFacade,
        cv_service_1.CvService,
        education_service_1.EducationService,
        certifications_service_1.CertificationsService,
        project_service_1.ProjectService,
        users_service_1.UsersService,
        experience_service_1.ExperienceService,
        scoring_service_1.ScoringService])
], CvImportService);
//# sourceMappingURL=cv-import.service.js.map