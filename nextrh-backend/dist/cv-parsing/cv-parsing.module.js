"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvParsingModule = void 0;
const common_1 = require("@nestjs/common");
const cv_parsing_service_1 = require("./cv-parsing.service");
const cv_parsing_controller_1 = require("./cv-parsing.controller");
const pdf_extractor_service_1 = require("./pdf-extractor/pdf-extractor.service");
const heuristic_parser_service_1 = require("./heuristic-parser/heuristic-parser.service");
const llm_service_1 = require("./llm/llm.service");
const cv_module_1 = require("../cvs/cv.module");
const typeorm_1 = require("@nestjs/typeorm");
const cv_entity_1 = require("../cvs/entities/cv.entity");
const education_entity_1 = require("../education/entities/education.entity");
const education_module_1 = require("../education/education.module");
const certifications_module_1 = require("../certifications/certifications.module");
const project_entity_1 = require("../project/entities/project.entity");
const project_module_1 = require("../project/project.module");
const experience_module_1 = require("../experience/experience.module");
const experience_entity_1 = require("../experience/entities/experience.entity");
let CvParsingModule = class CvParsingModule {
};
exports.CvParsingModule = CvParsingModule;
exports.CvParsingModule = CvParsingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([cv_entity_1.Cv]), cv_module_1.CvModule, education_module_1.EducationModule, typeorm_1.TypeOrmModule.forFeature([education_entity_1.Education]),
            certifications_module_1.CertificationsModule, project_module_1.ProjectModule, typeorm_1.TypeOrmModule.forFeature([project_entity_1.Project]),
            experience_module_1.ExperienceModule, typeorm_1.TypeOrmModule.forFeature([experience_entity_1.Experience])],
        providers: [cv_parsing_service_1.CvParsingService, pdf_extractor_service_1.PdfExtractorService, heuristic_parser_service_1.HeuristicParserService, llm_service_1.LlmService],
        controllers: [cv_parsing_controller_1.CvParsingController]
    })
], CvParsingModule);
//# sourceMappingURL=cv-parsing.module.js.map