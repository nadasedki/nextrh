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
var CvHeuristicextractionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvHeuristicextractionService = void 0;
const common_1 = require("@nestjs/common");
const text_segmentation_service_1 = require("./services/text-segmentation.service");
const contact_info_extractor_service_1 = require("./services/contact-info-extractor.service");
const skills_extractor_service_1 = require("./services/skills-extractor.service");
const certification_extractor_service_1 = require("./services/certification-extractor.service");
const education_extractor_service_1 = require("./services/education-extractor.service");
const project_extractor_service_1 = require("./services/project-extractor.service");
const experience_extractor_service_1 = require("./services/experience-extractor.service");
const text_cleaning_util_1 = require("./utils/text-cleaning.util");
let CvHeuristicextractionService = CvHeuristicextractionService_1 = class CvHeuristicextractionService {
    constructor(segmentationService, contactExtractor, skillsExtractor, certExtractor, eduExtractor, projectExtractor, expExtractor) {
        this.segmentationService = segmentationService;
        this.contactExtractor = contactExtractor;
        this.skillsExtractor = skillsExtractor;
        this.certExtractor = certExtractor;
        this.eduExtractor = eduExtractor;
        this.projectExtractor = projectExtractor;
        this.expExtractor = expExtractor;
        this.logger = new common_1.Logger(CvHeuristicextractionService_1.name);
    }
    parse(rawText, cvId = 0, userId = 0, filePath = '') {
        this.logger.log('Starting modular heuristic parsing pass...');
        const cleanedText = (0, text_cleaning_util_1.cleanRawText)(rawText);
        const sections = this.segmentationService.segmentText(cleanedText);
        const contactInfo = this.contactExtractor.extract(cleanedText);
        return {
            cv_id: cvId,
            user_id: userId,
            file_path: filePath,
            format: 'pdf',
            generated: true,
            last_updated: new Date(),
            full_name: contactInfo.fullName,
            profession: contactInfo.profession,
            email: contactInfo.email,
            phone: phoneFormattingFallback(contactInfo.phone),
            fax: contactInfo.fax,
            address: contactInfo.address,
            skills: this.skillsExtractor.extract(sections.skills ?? '', ''),
            certifications: this.certExtractor.extract(sections.certification ?? ''),
            education: this.eduExtractor.extract(sections.education ?? ''),
            projects: this.projectExtractor.extract(sections.projects ?? ''),
            experiences: this.expExtractor.extract(sections.experience ?? ''),
        };
    }
};
exports.CvHeuristicextractionService = CvHeuristicextractionService;
exports.CvHeuristicextractionService = CvHeuristicextractionService = CvHeuristicextractionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [text_segmentation_service_1.TextSegmentationService,
        contact_info_extractor_service_1.ContactInfoExtractorService,
        skills_extractor_service_1.SkillsExtractorService,
        certification_extractor_service_1.CertificationExtractorService,
        education_extractor_service_1.EducationExtractorService,
        project_extractor_service_1.ProjectExtractorService,
        experience_extractor_service_1.ExperienceExtractorService])
], CvHeuristicextractionService);
function phoneFormattingFallback(phone) {
    return phone.replace(/\s+/g, ' ').trim();
}
//# sourceMappingURL=cv-heuristic-extraction.service.js.map