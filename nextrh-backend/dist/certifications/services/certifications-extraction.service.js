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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationsParserService = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("../../parser/ai.service");
const certifications_service_1 = require("./certifications.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let CertificationsParserService = class CertificationsParserService {
    constructor(aiService, certsService) {
        this.aiService = aiService;
        this.certsService = certsService;
    }
    async extractAndPreviewCertificate(employeeId, file, currentUserFullName) {
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
                throw new common_1.BadRequestException('AI returned empty or unreadable data');
            }
            console.log(' [AI Extraction Success]:', certificateObj);
            const isFailedExtraction = (!certificateObj.certificate_name || String(certificateObj.certificate_name).trim().toLowerCase() === 'null') &&
                (!certificateObj.provider || String(certificateObj.provider).trim().toLowerCase() === 'null');
            if (isFailedExtraction) {
                console.warn(` [Parser-Orchestrator]: Extraction failed for file ${file.originalname}.`);
                throw new common_1.BadRequestException('Extraction failed: The document does not contain valid certificate data.');
            }
            const extractedHolder = certificateObj.certificate_holder ? String(certificateObj.certificate_holder).trim().toLowerCase() : '';
            const expectedHolder = currentUserFullName ? String(currentUserFullName).trim().toLowerCase() : '';
            if (!expectedHolder) {
                console.error(' Alerte Sécurité: FullName est VIDE ou UNDEFINED. Le JWT ne transmet pas le nom.');
                throw new common_1.BadRequestException('User profile name could not be verified from token.');
            }
            const cleanExtracted = extractedHolder.replace(/\s+/g, ' ');
            const cleanExpected = expectedHolder.replace(/\s+/g, ' ');
            if (cleanExtracted !== cleanExpected) {
                if (fs.existsSync(filePath))
                    fs.unlinkSync(filePath);
                throw new common_1.BadRequestException(`Identity mismatch: This certificate belongs to "${certificateObj.certificate_holder}", not you.`);
            }
            const standardizedIssueDate = this.formatDateToISO(certificateObj.date_of_obtention);
            const standardizedExpiryDate = this.formatDateToISO(certificateObj.date_of_expiration);
            const status = this.calculateStatus(standardizedExpiryDate);
            return {
                certName: certificateObj.certificate_name,
                provider: certificateObj.provider,
                issueDate: standardizedIssueDate,
                expiryDate: standardizedExpiryDate,
                holderName: certificateObj.holder_name || 'Unknown',
                status: status,
                filePath: filePath,
            };
        }
        catch (error) {
            console.error(' [Parser-Orchestrator Error]:', error.message);
            throw error;
        }
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
};
exports.CertificationsParserService = CertificationsParserService;
exports.CertificationsParserService = CertificationsParserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        certifications_service_1.CertificationsService])
], CertificationsParserService);
//# sourceMappingURL=certifications-extraction.service.js.map