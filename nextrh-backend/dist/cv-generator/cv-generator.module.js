"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvGeneratorModule = void 0;
const common_1 = require("@nestjs/common");
const cv_generator_controller_1 = require("./cv-generator.controller");
const pdf_generator_service_1 = require("./pdf-generator.service");
const employeeProfile_service_1 = require("../Employee/employeeProfile.service");
const cv_template_service_1 = require("./cv-template.service");
const cv_data_formatter_service_1 = require("./cv-data-formatter.service");
let CvGeneratorModule = class CvGeneratorModule {
};
exports.CvGeneratorModule = CvGeneratorModule;
exports.CvGeneratorModule = CvGeneratorModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [cv_generator_controller_1.CvGeneratorController],
        providers: [
            pdf_generator_service_1.PdfGeneratorService,
            cv_template_service_1.CvTemplateService,
            cv_data_formatter_service_1.CvDataFormatterService,
            employeeProfile_service_1.EmployeeProfileService,
        ],
    })
], CvGeneratorModule);
//# sourceMappingURL=cv-generator.module.js.map