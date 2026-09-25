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
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_1 = require("@nestjs/bullmq");
const cv_template_entity_1 = require("./entities/cv-template.entity");
const cv_generator_controller_1 = require("./cv-generator.controller");
const cv_template_service_1 = require("./services/cv-template.service");
const cv_template_ingestion_service_1 = require("./services/cv-template-ingestion.service");
const cv_generator_service_1 = require("./services/cv-generator.service");
const cv_data_formatter_service_1 = require("./services/cv-data-formatter.service");
const pdf_generator_service_1 = require("./services/pdf-generator.service");
const template_ingestion_processor_1 = require("./processors/template-ingestion.processor");
const cv_generation_processor_1 = require("./processors/cv-generation.processor");
const llm_module_1 = require("../llm/llm.module");
const EmployeesModule_1 = require("../Employee/EmployeesModule");
const nestjs_1 = require("@bull-board/nestjs");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
let CvGeneratorModule = class CvGeneratorModule {
};
exports.CvGeneratorModule = CvGeneratorModule;
exports.CvGeneratorModule = CvGeneratorModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([cv_template_entity_1.CvTemplate]),
            bullmq_1.BullModule.registerQueue({ name: 'template-ingestion' }, { name: 'cv-generation' }), nestjs_1.BullBoardModule.forFeature({ name: 'template-ingestion', adapter: bullMQAdapter_1.BullMQAdapter }, { name: 'cv-generation', adapter: bullMQAdapter_1.BullMQAdapter }),
            llm_module_1.LlmModule,
            EmployeesModule_1.EmployeesModule,
        ],
        controllers: [cv_generator_controller_1.CvGeneratorController],
        providers: [
            cv_template_service_1.CvTemplateService,
            cv_template_ingestion_service_1.CvTemplateIngestionService,
            cv_generator_service_1.CvGeneratorService,
            cv_data_formatter_service_1.CvDataFormatterService,
            pdf_generator_service_1.PdfGeneratorService,
            template_ingestion_processor_1.TemplateIngestionProcessor,
            cv_generation_processor_1.CvGenerationProcessor,
        ],
        exports: [cv_template_service_1.CvTemplateService, cv_generator_service_1.CvGeneratorService],
    })
], CvGeneratorModule);
//# sourceMappingURL=cv-generator.module.js.map