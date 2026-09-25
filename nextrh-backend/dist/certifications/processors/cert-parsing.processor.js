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
var CertParsingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertParsingProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const certifications_service_1 = require("../services/certifications.service");
let CertParsingProcessor = CertParsingProcessor_1 = class CertParsingProcessor extends bullmq_1.WorkerHost {
    constructor(certService) {
        super();
        this.certService = certService;
        this.logger = new common_1.Logger(CertParsingProcessor_1.name);
    }
    async process(job) {
        const { employeeId, fullDiskPath, relativePath, currentUserFullName } = job.data;
        this.logger.log(`[Job #${job.id}] Starting AI certificate extraction for Employee #${employeeId}...`);
        try {
            await job.updateProgress(20);
            const result = await this.certService.processCertificateFromDisk(employeeId, fullDiskPath, relativePath, currentUserFullName);
            await job.updateProgress(100);
            this.logger.log(`[Job #${job.id}] Certificate extracted successfully for Employee #${employeeId}!`);
            return result;
        }
        catch (error) {
            this.logger.error(`[Job #${job.id}] FAILED: ${error.message}`);
            throw error;
        }
    }
};
exports.CertParsingProcessor = CertParsingProcessor;
exports.CertParsingProcessor = CertParsingProcessor = CertParsingProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('cert-parsing', { concurrency: 1 }),
    __metadata("design:paramtypes", [certifications_service_1.CertificationsService])
], CertParsingProcessor);
//# sourceMappingURL=cert-parsing.processor.js.map