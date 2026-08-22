"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvParserModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const text_segmentation_service_1 = require("./services/text-segmentation.service");
const contact_info_extractor_service_1 = require("./services/contact-info-extractor.service");
const skills_extractor_service_1 = require("./services/skills-extractor.service");
const certification_extractor_service_1 = require("./services/certification-extractor.service");
const education_extractor_service_1 = require("./services/education-extractor.service");
const project_extractor_service_1 = require("./services/project-extractor.service");
const experience_extractor_service_1 = require("./services/experience-extractor.service");
const llm_fallback_service_1 = require("./services/llm-fallback.service");
const cv_heuristic_extraction_service_1 = require("./cv-heuristic-extraction.service");
const cv_extraction_orchestrator_service_1 = require("./cv-extraction-orchestrator.service");
const pdf_parser_service_1 = require("./services/pdf-parser.service");
const cv_parser_controller_1 = require("./cv-parser.controller");
const cv_evaluation_service_1 = require("./services/cv-evaluation.service");
const cv_multimodal_parser_service_1 = require("./cv-multimodal-parser.service");
let CvParserModule = class CvParserModule {
};
exports.CvParserModule = CvParserModule;
exports.CvParserModule = CvParserModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            text_segmentation_service_1.TextSegmentationService,
            contact_info_extractor_service_1.ContactInfoExtractorService,
            skills_extractor_service_1.SkillsExtractorService,
            certification_extractor_service_1.CertificationExtractorService,
            education_extractor_service_1.EducationExtractorService,
            project_extractor_service_1.ProjectExtractorService,
            experience_extractor_service_1.ExperienceExtractorService,
            llm_fallback_service_1.LlmFallbackService,
            cv_heuristic_extraction_service_1.CvHeuristicextractionService,
            cv_extraction_orchestrator_service_1.CvExtractionOrchestrator,
            pdf_parser_service_1.PdfParserService,
            cv_evaluation_service_1.CvEvaluationService,
            cv_multimodal_parser_service_1.CvMultimodalParserService
        ],
        controllers: [cv_parser_controller_1.CvParserController],
        exports: [cv_extraction_orchestrator_service_1.CvExtractionOrchestrator],
    })
], CvParserModule);
//# sourceMappingURL=cv-parser.module.js.map