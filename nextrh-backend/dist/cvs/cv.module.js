"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvModule = void 0;
const common_1 = require("@nestjs/common");
const cv_controller_1 = require("./cv.controller");
const cv_service_1 = require("./cv.service");
const typeorm_1 = require("@nestjs/typeorm");
const cv_entity_1 = require("./entities/cv.entity");
const education_module_1 = require("../education/education.module");
const cv_import_service_1 = require("./cv-import/cv-import.service");
const cv_parser_module_1 = require("../cv-parser/cv-parser.module");
const certifications_module_1 = require("../certifications/certifications.module");
const project_module_1 = require("../project/project.module");
const users_module_1 = require("../users/users.module");
const experience_module_1 = require("../experience/experience.module");
const scoring_module_1 = require("../scoring/scoring.module");
let CvModule = class CvModule {
};
exports.CvModule = CvModule;
exports.CvModule = CvModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([cv_entity_1.Cv]),
            education_module_1.EducationModule,
            certifications_module_1.CertificationsModule,
            project_module_1.ProjectModule,
            users_module_1.UsersModule,
            experience_module_1.ExperienceModule,
            scoring_module_1.ScoringModule,
            cv_parser_module_1.CvParserModule
        ],
        controllers: [cv_controller_1.CvController],
        providers: [cv_service_1.CvService, cv_import_service_1.CvImportService],
        exports: [cv_service_1.CvService],
    })
], CvModule);
//# sourceMappingURL=cv.module.js.map