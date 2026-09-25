"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CvQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvQueueProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const cv_ingestion_service_1 = require("../cv-ingestion.service");
const fs = __importStar(require("fs/promises"));
let CvQueueProcessor = CvQueueProcessor_1 = class CvQueueProcessor extends bullmq_1.WorkerHost {
    constructor(cvIngestionService) {
        super();
        this.cvIngestionService = cvIngestionService;
        this.logger = new common_1.Logger(CvQueueProcessor_1.name);
    }
    async process(job) {
        const { userId, fullDiskPath, relativePath, originalName } = job.data;
        this.logger.log(`[Job #${job.id}] Starting AI background parsing for User #${userId}...`);
        try {
            const fileBuffer = await fs.readFile(fullDiskPath);
            await job.updateProgress(20);
            const result = await this.cvIngestionService.ingestCv(fileBuffer, userId, originalName, relativePath);
            await job.updateProgress(100);
            this.logger.log(`[Job #${job.id}] Finished parsing successfully for User #${userId}!`);
            return { cvId: result.cvId, status: 'completed' };
        }
        catch (error) {
            this.logger.error(`[Job #${job.id}] FAILED: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.CvQueueProcessor = CvQueueProcessor;
exports.CvQueueProcessor = CvQueueProcessor = CvQueueProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('cv-parsing', { concurrency: 1 }),
    __metadata("design:paramtypes", [cv_ingestion_service_1.CvIngestionService])
], CvQueueProcessor);
//# sourceMappingURL=cv-queue.processor.js.map