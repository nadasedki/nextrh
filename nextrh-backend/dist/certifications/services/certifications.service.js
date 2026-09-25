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
var CertificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const certification_entity_1 = require("../entities/certification.entity");
const ai_service_1 = require("../../parser/ai.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let CertificationsService = CertificationsService_1 = class CertificationsService {
    constructor(certificationRepo, aiService, configService, eventEmitter, certQueue) {
        this.certificationRepo = certificationRepo;
        this.aiService = aiService;
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.certQueue = certQueue;
        this.logger = new common_1.Logger(CertificationsService_1.name);
        const configuredPath = this.configService.get('UPLOAD_CERT_DESTINATION') || './uploads/certifications';
        this.certUploadDir = path.isAbsolute(configuredPath)
            ? configuredPath
            : path.join(process.cwd(), configuredPath);
    }
    async enqueueCertParsing(employeeId, file, currentUserFullName) {
        await fs.mkdir(this.certUploadDir, { recursive: true });
        const ext = path.extname(file.originalname) || '.pdf';
        const fileName = `cert-${employeeId}-${Date.now()}${ext}`;
        const fullDiskPath = path.join(this.certUploadDir, fileName);
        await fs.writeFile(fullDiskPath, file.buffer);
        const relativePath = path.join('uploads', 'certifications', fileName).replace(/\\/g, '/');
        const job = await this.certQueue.add('parse-certificate', {
            employeeId,
            fullDiskPath,
            relativePath,
            currentUserFullName,
            originalName: file.originalname,
        }, {
            attempts: 1,
            removeOnComplete: { age: 3600, count: 500 },
            removeOnFail: { age: 86400 },
        });
        return {
            status: 'queued',
            message: 'Certificate uploaded and queued for AI analysis.',
            jobId: job.id,
        };
    }
    async getJobStatus(jobId) {
        const job = await this.certQueue.getJob(jobId);
        if (!job) {
            return { jobId, state: 'completed', status: 'completed', progress: 100 };
        }
        const state = await job.getState();
        return {
            jobId: job.id,
            state,
            progress: job.progress,
            result: job.returnvalue || null,
            failedReason: job.failedReason || null,
        };
    }
    async processCertificateFromDisk(employeeId, fullDiskPath, relativePath, currentUserFullName) {
        try {
            const aiData = await this.aiService.extractCertificate(fullDiskPath);
            const certObj = Array.isArray(aiData) ? aiData[0] : aiData;
            if (!certObj || Object.keys(certObj).length === 0) {
                throw new common_1.BadRequestException('AI could not extract valid data from document.');
            }
            const extractedHolder = (certObj.certificate_holder || certObj.holder_name || '').trim().toLowerCase().replace(/\s+/g, ' ');
            const expectedHolder = (currentUserFullName || '').trim().toLowerCase().replace(/\s+/g, ' ');
            if (!expectedHolder) {
                throw new common_1.BadRequestException('User profile name could not be verified from token.');
            }
            if (extractedHolder && !expectedHolder.includes(extractedHolder) && !extractedHolder.includes(expectedHolder)) {
                await fs.unlink(fullDiskPath).catch(() => { });
                throw new common_1.BadRequestException(`Identity mismatch: This certificate belongs to "${certObj.certificate_holder}", not "${currentUserFullName}".`);
            }
            const issueDate = this.formatDateToISO(certObj.date_of_obtention || certObj.issue_date);
            const expiryDate = this.formatDateToISO(certObj.date_of_expiration || certObj.expiry_date);
            const status = this.calculateStatus(expiryDate);
            return {
                certName: certObj.certificate_name || certObj.name || 'Certificate',
                provider: certObj.provider || certObj.issuer || 'Provider',
                issueDate,
                expiryDate,
                holderName: certObj.certificate_holder || currentUserFullName,
                status,
                filePath: relativePath,
            };
        }
        catch (error) {
            this.logger.error(`Certificate parsing failed: ${error.message}`);
            await fs.unlink(fullDiskPath).catch(() => { });
            throw error;
        }
    }
    async findMyCertifications(employeeId) {
        return await this.certificationRepo.find({
            where: { userId: employeeId },
            order: { expiryDate: 'ASC' },
            relations: ['user'],
        });
    }
    async create(employeeId, dto) {
        if (!dto.name || !dto.issuer) {
            throw new common_1.BadRequestException('Name and Issuer are required');
        }
        const targetExpiry = dto.expirationDate ? new Date(dto.expirationDate) : null;
        const calculatedStatus = this.calculateStatus(targetExpiry);
        const certification = this.certificationRepo.create({
            certName: dto.name,
            provider: dto.issuer,
            issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
            expiryDate: targetExpiry,
            credentialId: dto.credentialId,
            status: calculatedStatus,
            userId: employeeId,
            filePath: dto.filePath || null,
        });
        const savedCert = await this.certificationRepo.save(certification);
        this.eventEmitter.emit('certification.saved', {
            certId: savedCert.certId,
            employeeId,
            certName: savedCert.certName,
            expiryDate: savedCert.expiryDate,
        });
        this.eventEmitter.emit('certification.index_saved', {
            entityId: savedCert.certId,
            userId: employeeId,
        });
        return savedCert;
    }
    async update(id, employeeId, dto) {
        if (Object.keys(dto).length === 0) {
            throw new common_1.BadRequestException('No data provided for update');
        }
        const certification = await this.certificationRepo.findOne({
            where: { certId: id },
            relations: ['user'],
        });
        if (!certification)
            throw new common_1.NotFoundException('Certification not found');
        if (certification.userId !== employeeId)
            throw new common_1.ForbiddenException('Unauthorized access');
        if (dto.name)
            certification.certName = dto.name;
        if (dto.issuer)
            certification.provider = dto.issuer;
        if (dto.issueDate)
            certification.issueDate = new Date(dto.issueDate);
        if (dto.credentialId !== undefined)
            certification.credentialId = dto.credentialId;
        if (dto.expirationDate !== undefined) {
            const targetExpiry = dto.expirationDate ? new Date(dto.expirationDate) : null;
            certification.expiryDate = targetExpiry;
            certification.status = this.calculateStatus(targetExpiry);
        }
        else if (dto.status) {
            certification.status = dto.status;
        }
        const updatedCert = await this.certificationRepo.save(certification);
        this.eventEmitter.emit('certification.updated', { employeeId, certId: updatedCert.certId });
        this.eventEmitter.emit('certification.index_saved', { entityId: updatedCert.certId, userId: employeeId });
        return updatedCert;
    }
    async remove(id, employeeId) {
        const certification = await this.certificationRepo.findOne({
            where: { certId: id },
            relations: ['user'],
        });
        if (!certification)
            throw new common_1.NotFoundException('Certification not found');
        if (certification.userId !== employeeId)
            throw new common_1.ForbiddenException('Unauthorized access');
        if (certification.filePath && !certification.filePath.includes('uploads/cvs/')) {
            try {
                const fullDiskPath = path.isAbsolute(certification.filePath)
                    ? certification.filePath
                    : path.join(process.cwd(), certification.filePath);
                await fs.unlink(fullDiskPath);
            }
            catch (err) {
                this.logger.warn(`Could not delete file: ${err.message}`);
            }
        }
        await this.certificationRepo.remove(certification);
        this.eventEmitter.emit('certification.deleted', { employeeId, certId: id });
        this.eventEmitter.emit('certification.index_deleted', { entityId: id, userId: employeeId });
    }
    async createBulkFromParsedData(certsData, userId, filePath, cvEntity) {
        if (!certsData || certsData.length === 0)
            return [];
        const entities = certsData.map((cert) => {
            const targetExpiry = cert.expiry_date ? new Date(cert.expiry_date) : null;
            return this.certificationRepo.create({
                certName: cert.certName || cert.cert_name,
                provider: cert.provider,
                issueDate: cert.issue_date ? new Date(cert.issue_date) : null,
                expiryDate: targetExpiry,
                status: this.calculateStatus(targetExpiry),
                userId,
                filePath: filePath || null,
                cv: cvEntity,
            });
        });
        return await this.certificationRepo.save(entities);
    }
    calculateStatus(expiryDate) {
        if (!expiryDate)
            return 'active';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        if (isNaN(expiry.getTime()))
            return 'active';
        if (expiry < today)
            return 'expired';
        const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (diffDays <= 30)
            return 'expiring_soon';
        return 'active';
    }
    formatDateToISO(dateStr) {
        if (!dateStr || String(dateStr).trim().toLowerCase() === 'null')
            return null;
        let cleanedStr = dateStr
            .trim()
            .replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)[,\s]+/i, '')
            .replace(/janvier/i, 'January').replace(/fevrier/i, 'February').replace(/mars/i, 'March')
            .replace(/avril/i, 'April').replace(/mai/i, 'May').replace(/juin/i, 'June')
            .replace(/juillet/i, 'July').replace(/aout/i, 'August').replace(/septembre/i, 'September')
            .replace(/octobre/i, 'October').replace(/novembre/i, 'November').replace(/decembre/i, 'December');
        const timestamp = Date.parse(cleanedStr);
        if (isNaN(timestamp))
            return null;
        const d = new Date(timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    async evaluateAllCertificationsStatus() {
        const certifications = await this.certificationRepo.find({
            where: [{ status: 'active' }, { status: 'expiring_soon' }]
        });
        let updatedCount = 0;
        for (const cert of certifications) {
            if (!cert.expiryDate)
                continue;
            const newStatus = this.calculateStatus(cert.expiryDate);
            if (cert.status !== newStatus) {
                const oldStatus = cert.status;
                cert.status = newStatus;
                await this.certificationRepo.save(cert);
                updatedCount++;
                this.eventEmitter.emit('certification.status.changed', {
                    certId: cert.certId,
                    employeeId: cert.userId,
                    certName: cert.certName,
                    oldStatus,
                    newStatus,
                    expiryDate: cert.expiryDate
                });
            }
        }
        return { updatedCount };
    }
};
exports.CertificationsService = CertificationsService;
exports.CertificationsService = CertificationsService = CertificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(certification_entity_1.Certification)),
    __param(4, (0, bullmq_1.InjectQueue)('cert-parsing')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        ai_service_1.AiService,
        config_1.ConfigService,
        event_emitter_1.EventEmitter2,
        bullmq_2.Queue])
], CertificationsService);
//# sourceMappingURL=certifications.service.js.map