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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CvTemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvTemplateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cv_template_entity_1 = require("../entities/cv-template.entity");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let CvTemplateService = CvTemplateService_1 = class CvTemplateService {
    constructor(templateRepo, configService, ingestionQueue) {
        this.templateRepo = templateRepo;
        this.configService = configService;
        this.ingestionQueue = ingestionQueue;
        this.logger = new common_1.Logger(CvTemplateService_1.name);
        const configuredPath = this.configService.get('UPLOAD_TEMPLATE_DESTINATION') || './uploads/templates';
        this.templateUploadDir = path.isAbsolute(configuredPath)
            ? configuredPath
            : path.join(process.cwd(), configuredPath);
    }
    async enqueueTemplateIngestion(file, name, userId) {
        await fs.mkdir(this.templateUploadDir, { recursive: true });
        const ext = path.extname(file.originalname) || '.pdf';
        const fileName = `template-${userId}-${Date.now()}${ext}`;
        const fullDiskPath = path.join(this.templateUploadDir, fileName);
        await fs.writeFile(fullDiskPath, file.buffer);
        const relativePdfPath = path.join('uploads', 'templates', fileName).replace(/\\/g, '/');
        const job = await this.ingestionQueue.add('ingest-template', {
            name,
            userId,
            fullDiskPath,
            relativePdfPath,
        }, {
            attempts: 1,
            removeOnComplete: { age: 3600, count: 500 },
            removeOnFail: { age: 86400 },
        });
        return {
            status: 'queued',
            message: 'Template uploaded and queued for AI visual extraction.',
            jobId: job.id,
        };
    }
    async getIngestionJobStatus(jobId) {
        const job = await this.ingestionQueue.getJob(jobId);
        if (!job)
            return { jobId, state: 'completed', status: 'completed', progress: 100 };
        const state = await job.getState();
        return {
            jobId: job.id,
            state,
            progress: job.progress,
            result: job.returnvalue || null,
            failedReason: job.failedReason || null,
        };
    }
    async getTemplateById(templateId) {
        const template = await this.templateRepo.findOne({ where: { id: templateId } });
        if (!template) {
            throw new common_1.NotFoundException(`Template #${templateId} not found.`);
        }
        return template;
    }
    async getSkeleton(templateId) {
        const template = await this.templateRepo.findOne({
            where: { id: templateId },
            select: ['template_html'],
        });
        if (!template) {
            throw new common_1.NotFoundException(`Template #${templateId} not found.`);
        }
        return template.template_html;
    }
    async findAll() {
        return await this.templateRepo.find({
            select: ['id', 'name', 'template_html', 'original_pdf_url', 'created_at'],
            order: { created_at: 'DESC' },
        });
    }
    async remove(templateId) {
        this.logger.log(`Deleting CV template #${templateId}`);
        const template = await this.getTemplateById(templateId);
        if (template.original_pdf_url) {
            try {
                const fullDiskPath = path.isAbsolute(template.original_pdf_url)
                    ? template.original_pdf_url
                    : path.join(process.cwd(), template.original_pdf_url);
                await fs.unlink(fullDiskPath);
            }
            catch (err) {
                this.logger.warn(`Could not delete template file: ${err.message}`);
            }
        }
        await this.templateRepo.remove(template);
    }
};
exports.CvTemplateService = CvTemplateService;
exports.CvTemplateService = CvTemplateService = CvTemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cv_template_entity_1.CvTemplate)),
    __param(2, (0, bullmq_1.InjectQueue)('template-ingestion')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService,
        bullmq_2.Queue])
], CvTemplateService);
//# sourceMappingURL=cv-template.service.js.map