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
const certification_entity_1 = require("./entities/certification.entity");
const ai_service_1 = require("../parser/ai.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const user_entity_1 = require("../users/entities/user.entity");
const google_calendar_service_1 = require("../google-calendar/google-calendar.service");
let CertificationsService = class CertificationsService {
    constructor(certificationRepo, aiService, userRepo, googleCalendarService) {
        this.certificationRepo = certificationRepo;
        this.aiService = aiService;
        this.userRepo = userRepo;
        this.googleCalendarService = googleCalendarService;
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
        const certification = this.certificationRepo.create({
            certName: dto.name,
            provider: dto.issuer,
            issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
            expiryDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
            credentialId: dto.credentialId,
            status: dto.status || 'active',
            userId: employeeId,
            filePath: dto.filePath || null,
        });
        const savedCert = await this.certificationRepo.save(certification);
        if (savedCert.expiryDate) {
            await this.syncToCalendar(employeeId, savedCert);
        }
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
        if (dto.status)
            certification.status = dto.status;
        return this.certificationRepo.save(certification);
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
        return this.certificationRepo.remove(certification);
    }
    async extractAndSaveCertificate(employeeId, file) {
        try {
            const userFolder = path.join(process.cwd(), 'uploads', `user_${employeeId}`);
            if (!fs.existsSync(userFolder)) {
                fs.mkdirSync(userFolder, { recursive: true });
            }
            const filePath = path.join(userFolder, file.originalname);
            fs.writeFileSync(filePath, file.buffer);
            const aiData = await this.aiService.extractCertificate(filePath);
            const certificateObj = Array.isArray(aiData) ? aiData[0] : aiData;
            if (!certificateObj || Object.keys(certificateObj).length === 0) {
                throw new Error('AI returned empty data');
            }
            console.log('AI Data:', certificateObj);
            const entityData = this.mapAiToEntity(certificateObj, filePath);
            const certification = this.certificationRepo.create({
                ...entityData,
                userId: employeeId,
            });
            const savedCert = await this.certificationRepo.save(certification);
            if (savedCert.expiryDate) {
                await this.syncToCalendar(employeeId, savedCert);
            }
        }
        catch (error) {
            console.error('Error saving certificate:', error.message);
            throw error;
        }
    }
    mapAiToEntity(aiData, filePath) {
        const status = this.calculateStatus(aiData.date_of_expiration);
        return {
            certName: aiData.certificate_name,
            provider: aiData.provider,
            issueDate: aiData.date_of_obtention ? new Date(aiData.date_of_obtention) : null,
            expiryDate: aiData.date_of_expiration ? new Date(aiData.date_of_expiration) : null,
            credentialId: aiData.credential_id || null,
            status,
            filePath,
        };
    }
    calculateStatus(expirationDate) {
        if (!expirationDate)
            return 'active';
        const today = new Date();
        const expiry = new Date(expirationDate);
        if (isNaN(expiry.getTime()))
            return 'active';
        if (expiry < today)
            return 'expired';
        const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (diffDays <= 30)
            return 'expiring_soon';
        return 'active';
    }
    async createBulkFromParsedData(certsData, userId, filePath, cvEntity) {
        if (!certsData || certsData.length === 0)
            return [];
        const entities = certsData.map((cert) => {
            return this.certificationRepo.create({
                certName: cert.certName,
                provider: this.inferProvider(cert.certName),
                issueDate: this.parseFrenchDate(cert.date),
                expiryDate: null,
                status: 'active',
                userId: userId,
                filePath: filePath || null,
                cv: cvEntity,
            });
        });
        return await this.certificationRepo.save(entities);
    }
    parseFrenchDate(dateStr) {
        if (!dateStr || dateStr.toLowerCase().includes('non spécifiée'))
            return null;
        const months = {
            janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
            juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
        };
        const parts = dateStr.toLowerCase().split(/\s+/);
        const year = parts.find((p) => /\d{4}/.test(p));
        const monthName = parts.find((p) => months[p] !== undefined);
        if (year) {
            const m = monthName ? months[monthName] : 0;
            return new Date(parseInt(year), m, 1);
        }
        return null;
    }
    inferProvider(certName) {
        const name = certName.toLowerCase();
        if (name.includes('cisco') || name.includes('ccna') || name.includes('ccnp'))
            return 'Cisco';
        if (name.includes('fortinet') || name.includes('nse'))
            return 'Fortinet';
        if (name.includes('microsoft') || name.includes('azure') || name.includes('mcsa'))
            return 'Microsoft';
        if (name.includes('aws') || name.includes('amazon'))
            return 'AWS';
        if (name.includes('dell'))
            return 'DELL';
        if (name.includes('hp'))
            return 'HP';
        return 'Professional Issuer';
    }
    async syncToCalendar(userId, cert) {
        try {
            const user = await this.userRepo.findOne({ where: { user_id: userId } });
            if (user && user.email && cert.expiryDate) {
                await this.googleCalendarService.scheduleEmployeeReminder(user.full_name, user.email, cert.certName, cert.expiryDate.toISOString());
                console.log(` Synchro Agenda réussie pour ${user.email}`);
            }
        }
        catch (err) {
            console.error(" Erreur de synchronisation Agenda:", err.message);
        }
    }
};
exports.CertificationsService = CertificationsService;
exports.CertificationsService = CertificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(certification_entity_1.Certification)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        ai_service_1.AiService,
        typeorm_2.Repository,
        google_calendar_service_1.GoogleCalendarService])
], CertificationsService);
//# sourceMappingURL=certifications.service.js.map