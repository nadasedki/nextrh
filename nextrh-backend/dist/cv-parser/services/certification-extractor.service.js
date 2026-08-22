"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationExtractorService = void 0;
const common_1 = require("@nestjs/common");
const cv_parser_constants_1 = require("../constants/cv-parser.constants");
const date_util_1 = require("../utils/date.util");
const validation_util_1 = require("../utils/validation.util");
let CertificationExtractorService = class CertificationExtractorService {
    constructor() {
        this.CERT_DATE_ENDING_REGEX = /(?:(Janvier|Février|Fevrier|Mars|Avril|Mai|Juin|Juillet|Août|Aout|Septembre|Octobre|Novembre|Décembre|Decembre)\s+)?\(?(\d{4})\)?\s*$/i;
        this.CERT_PARSER_REGEX = /^(.+?)\s+(?:(Janvier|Février|Fevrier|Mars|Avril|Mai|Juin|Juillet|Août|Aout|Septembre|Octobre|Novembre|Décembre|Decembre)\s+)?\(?(\d{4})\)?\s*$/i;
    }
    extract(sectionText) {
        const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const combined = [];
        let buffer = '';
        for (const line of rawLines) {
            if (/^\s*Certificat[s]?\s+Date\s+d['’]obtention\s*$/i.test(line))
                continue;
            if (/^\d+$/.test(line) && !/^\d{4}$/.test(line))
                continue;
            buffer = buffer === '' ? line : `${buffer} ${line}`;
            if (this.CERT_DATE_ENDING_REGEX.test(line)) {
                combined.push(buffer);
                buffer = '';
            }
        }
        if (buffer)
            combined.push(buffer);
        const certifications = [];
        for (const line of combined) {
            const match = line.match(this.CERT_PARSER_REGEX);
            if (!match)
                continue;
            let certName = match[1]
                .replace(/^(Certificat|Certification)\s+/gi, '')
                .replace(/^[,\s\-\–\.\*•\(]+|[,\s\-\–\.\*•\(]+$/g, '')
                .trim();
            const monthStr = match[2];
            const yearStr = match[3];
            const provider = cv_parser_constants_1.KNOWN_PROVIDERS.find(p => new RegExp(p, 'i').test(certName)) ?? 'Professional Issuer';
            const dateStr = monthStr ? `${monthStr} ${yearStr}` : yearStr;
            const issueDate = monthStr
                ? (0, date_util_1.parseMonthYear)(monthStr, yearStr)
                : new Date(Date.UTC(parseInt(yearStr, 10), 0, 1));
            certifications.push({
                cert_name: certName,
                provider,
                date: dateStr,
                issue_date: issueDate,
                expiry_date: null,
            });
        }
        if (certifications.length === 0) {
            return this.extractCertificationsWithoutDate(rawLines);
        }
        return certifications;
    }
    extractCertificationsWithoutDate(rawLines) {
        const joined = [];
        for (const line of rawLines) {
            if (/^\s*Certificat[s]?\s+Date\s+d['’]obtention\s*$/i.test(line))
                continue;
            if (/^\d+$/.test(line))
                continue;
            const clean = line.replace(/^[:\s\-\–\.\*•]+/, '').trim();
            const startsWithProvider = cv_parser_constants_1.KNOWN_PROVIDERS.some(p => new RegExp(`^${p}`, 'i').test(clean));
            if (startsWithProvider || joined.length === 0) {
                joined.push(clean);
            }
            else {
                joined[joined.length - 1] += ` ${clean}`;
            }
        }
        return joined
            .filter(line => line.length > 3)
            .map(line => ({
            cert_name: line,
            provider: cv_parser_constants_1.KNOWN_PROVIDERS.find(p => new RegExp(p, 'i').test(line)) ?? 'Professional Issuer',
            date: null,
            issue_date: null,
            expiry_date: null,
        }));
    }
    isValid(data) {
        return (0, validation_util_1.isCertificationSectionValid)(data);
    }
};
exports.CertificationExtractorService = CertificationExtractorService;
exports.CertificationExtractorService = CertificationExtractorService = __decorate([
    (0, common_1.Injectable)()
], CertificationExtractorService);
//# sourceMappingURL=certification-extractor.service.js.map