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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const certification_entity_1 = require("../entities/certification.entity");
const ai_service_1 = require("../../parser/ai.service");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
let CertificationsService = class CertificationsService {
    constructor(certificationRepo, aiService, configService, eventEmitter) {
        this.certificationRepo = certificationRepo;
        this.aiService = aiService;
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        const configuredPath = this.configService.get('UPLOAD_CERT_DESTINATION') || './uploads/certifications';
        this.certUploadDir = path.isAbsolute(configuredPath)
            ? configuredPath
            : path.join(process.cwd(), configuredPath);
    }
    async saveCertFileToDisk(fileBuffer, employeeId, originalName) {
        await fs.mkdir(this.certUploadDir, { recursive: true });
        const ext = path.extname(originalName) || '.pdf';
        const fileName = `cert-${employeeId}-${Date.now()}${ext}`;
        const fullPath = path.join(this.certUploadDir, fileName);
        await fs.writeFile(fullPath, fileBuffer);
        return `uploads/certifications/${fileName}`;
    }
    async findMyCertifications(employeeId) {
        const certs = await this.certificationRepo.find({
            where: { userId: employeeId },
            order: { expiryDate: 'ASC' },
            relations: ['user'],
        });
        return certs;
    }
    async create(employeeId, dto, fileBuffer, originalName) {
        if (!dto.name || !dto.issuer) {
            throw new common_1.BadRequestException('Name and Issuer are required');
        }
        let savedFilePath = dto.filePath || null;
        if (fileBuffer && originalName) {
            savedFilePath = await this.saveCertFileToDisk(fileBuffer, employeeId, originalName);
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
            filePath: savedFilePath,
        });
        const savedCert = await this.certificationRepo.save(certification);
        this.eventEmitter.emit('certification.saved', {
            certId: savedCert.certId,
            employeeId: employeeId,
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
        if (!certification) {
            throw new common_1.NotFoundException('Certification not found');
        }
        if (certification.userId !== employeeId) {
            throw new common_1.ForbiddenException('You cannot modify this certification');
        }
        if (dto.name)
            certification.certName = dto.name;
        if (dto.issuer)
            certification.provider = dto.issuer;
        if (dto.issueDate)
            certification.issueDate = new Date(dto.issueDate);
        if (dto.expirationDate)
            certification.expiryDate = new Date(dto.expirationDate);
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
        this.eventEmitter.emit('certification.updated', {
            employeeId: employeeId,
            certId: updatedCert.certId,
        });
        this.eventEmitter.emit('certification.index_saved', {
            entityId: updatedCert.certId,
            userId: employeeId,
        });
        return updatedCert;
    }
    async remove(id, employeeId) {
        const certification = await this.certificationRepo.findOne({
            where: { certId: id },
            relations: ['user'],
        });
        if (!certification) {
            throw new common_1.NotFoundException('Certification not found');
        }
        if (certification.userId !== employeeId) {
            throw new common_1.ForbiddenException('You cannot delete this certification');
        }
        if (certification.filePath && !certification.filePath.includes('uploads/cvs/')) {
            try {
                const fullPath = path.join(process.cwd(), certification.filePath);
                await fs.unlink(fullPath);
            }
            catch (err) {
            }
        }
        await this.certificationRepo.remove(certification);
        this.eventEmitter.emit('certification.deleted', {
            employeeId: employeeId,
            certId: id,
        });
        this.eventEmitter.emit('certification.index_deleted', {
            entityId: id,
            userId: employeeId,
        });
    }
    async createBulkFromParsedData(certsData, userId, filePath, cvEntity) {
        if (!certsData || certsData.length === 0)
            return [];
        const entities = certsData.map((cert) => {
            return this.certificationRepo.create({
                certName: cert.certName,
                provider: cert.provider,
                issueDate: cert.issue_date,
                expiryDate: cert.expiry_date,
                userId: userId,
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
        if (expiry < today) {
            return 'expired';
        }
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        if (expiry <= thirtyDaysFromNow) {
            return 'expiring_soon';
        }
        return 'active';
    }
    async evaluateAllCertificationsStatus() {
        const certifications = await this.certificationRepo.find({
            where: [
                { status: 'active' },
                { status: 'expiring_soon' }
            ]
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
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                    expiryDate: cert.expiryDate
                });
            }
        }
        return { updatedCount };
    }
};
exports.CertificationsService = CertificationsService;
exports.CertificationsService = CertificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(certification_entity_1.Certification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        ai_service_1.AiService,
        config_1.ConfigService,
        event_emitter_1.EventEmitter2])
], CertificationsService);
//# sourceMappingURL=certifications.service.js.map