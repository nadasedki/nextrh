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
const event_emitter_1 = require("@nestjs/event-emitter");
let CertificationsService = class CertificationsService {
    constructor(certificationRepo, aiService, eventEmitter) {
        this.certificationRepo = certificationRepo;
        this.aiService = aiService;
        this.eventEmitter = eventEmitter;
    }
    async findMyCertifications(employeeId) {
        const certs = await this.certificationRepo.find({
            where: { userId: employeeId },
            order: { expiryDate: 'ASC' },
            relations: ['user'],
        });
        return certs;
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
            employeeId: employeeId,
            certName: savedCert.certName,
            expiryDate: savedCert.expiryDate
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
        return updatedCert;
    }
    async remove(id, employeeId) {
        const certification = await this.certificationRepo.findOne({
            where: { certId: id },
            relations: ['user'],
        });
        this.eventEmitter.emit('certification.deleted', { certId: id });
        if (!certification) {
            throw new common_1.NotFoundException('Certification not found');
        }
        if (certification.userId !== employeeId) {
            throw new common_1.ForbiddenException('You cannot delete this certification');
        }
        await this.certificationRepo.remove(certification);
        this.eventEmitter.emit('certification.deleted', {
            employeeId: employeeId,
            certId: id
        });
    }
    async createBulkFromParsedData(certsData, userId, filePath, cvEntity) {
        if (!certsData || certsData.length === 0)
            return [];
        const entities = certsData.map((cert) => {
            return this.certificationRepo.create({
                certName: cert.certName,
                provider: cert.provider,
                issueDate: cert.issueDate,
                expiryDate: null,
                status: 'active',
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
        event_emitter_1.EventEmitter2])
], CertificationsService);
//# sourceMappingURL=certifications.service.js.map