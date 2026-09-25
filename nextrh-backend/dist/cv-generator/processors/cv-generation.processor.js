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
var CvGenerationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvGenerationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const cv_generator_service_1 = require("../services/cv-generator.service");
let CvGenerationProcessor = CvGenerationProcessor_1 = class CvGenerationProcessor extends bullmq_1.WorkerHost {
    constructor(cvGeneratorService) {
        super();
        this.cvGeneratorService = cvGeneratorService;
        this.logger = new common_1.Logger(CvGenerationProcessor_1.name);
    }
    async process(job) {
        const { templateId, userId } = job.data;
        this.logger.log(`[Job #${job.id}] Executing background CV compilation...`);
        try {
            await job.updateProgress(20);
            const result = await this.cvGeneratorService.compileAndRenderPdf(templateId, userId);
            await job.updateProgress(100);
            this.logger.log(` [Job #${job.id}] COMPLETED: CV generated successfully Download ready at: ${result.downloadUrl}`);
            return result;
        }
        catch (error) {
            this.logger.error(`[Job #${job.id}] Generation failed: ${error.message}`);
            throw error;
        }
    }
};
exports.CvGenerationProcessor = CvGenerationProcessor;
exports.CvGenerationProcessor = CvGenerationProcessor = CvGenerationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('cv-generation', { concurrency: 1 }),
    __metadata("design:paramtypes", [cv_generator_service_1.CvGeneratorService])
], CvGenerationProcessor);
//# sourceMappingURL=cv-generation.processor.js.map