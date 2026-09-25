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
var TemplateIngestionProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateIngestionProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const cv_template_ingestion_service_1 = require("../services/cv-template-ingestion.service");
let TemplateIngestionProcessor = TemplateIngestionProcessor_1 = class TemplateIngestionProcessor extends bullmq_1.WorkerHost {
    constructor(ingestionService) {
        super();
        this.ingestionService = ingestionService;
        this.logger = new common_1.Logger(TemplateIngestionProcessor_1.name);
    }
    async process(job) {
        const { fullDiskPath, relativePdfPath, name, userId } = job.data;
        this.logger.log(`[Job #${job.id}] Starting layout extraction for template: "${name}"...`);
        try {
            await job.updateProgress(20);
            const result = await this.ingestionService.ingestTemplateFromDisk(fullDiskPath, relativePdfPath, name, userId);
            await job.updateProgress(100);
            this.logger.log(`[Job #${job.id}] COMPLETED: Template ingestion successfull`);
            return result;
        }
        catch (error) {
            this.logger.error(`[Job #${job.id}] Ingestion failed: ${error.message}`);
            throw error;
        }
    }
};
exports.TemplateIngestionProcessor = TemplateIngestionProcessor;
exports.TemplateIngestionProcessor = TemplateIngestionProcessor = TemplateIngestionProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('template-ingestion', { concurrency: 1 }),
    __metadata("design:paramtypes", [cv_template_ingestion_service_1.CvTemplateIngestionService])
], TemplateIngestionProcessor);
//# sourceMappingURL=template-ingestion.processor.js.map