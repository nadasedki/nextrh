"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactInfoExtractorService = void 0;
const common_1 = require("@nestjs/common");
const compromise_1 = __importDefault(require("compromise"));
let ContactInfoExtractorService = class ContactInfoExtractorService {
    extract(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let nameIdx = 0;
        while (nameIdx < lines.length &&
            (lines[nameIdx].match(/^\d+$/) || lines[nameIdx].length <= 2)) {
            nameIdx++;
        }
        const fullName = lines[nameIdx] ?? 'Unknown';
        const profession = lines[nameIdx + 1] ?? '';
        const addressMatch = text.match(/Adresse[:\s]*(.+?)(?=\n|Expérience|Formation|Certification|Projet|$)/i);
        let address = addressMatch ? addressMatch[1].trim() : '';
        if (!address) {
            const places = (0, compromise_1.default)(text).places().out('array');
            address = places.length > 0 ? [...new Set(places)].join(', ') : '';
        }
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/i;
        const phoneRegex = /([\+\d\s]{8,})/i;
        const emailLabelMatch = text.match(/Email\s*:\s*(.+?)(?=\n|$)/i);
        const email = emailLabelMatch
            ? emailLabelMatch[1].trim().match(emailRegex)?.[0] ?? ''
            : text.match(emailRegex)?.[0] ?? '';
        const phoneLabelMatch = text.match(/Tél\s*:\s*(.+?)(?=\n|$)/i);
        const phone = phoneLabelMatch
            ? phoneLabelMatch[1].trim().match(phoneRegex)?.[0] ?? ''
            : text.match(phoneRegex)?.[0] ?? '';
        const fax = text.match(/Fax\s*:\s*([\+\d\s]{8,})/i)?.[1].trim() ?? '';
        return {
            fullName,
            profession,
            phone,
            fax,
            email,
            address: address || 'Not specified',
        };
    }
};
exports.ContactInfoExtractorService = ContactInfoExtractorService;
exports.ContactInfoExtractorService = ContactInfoExtractorService = __decorate([
    (0, common_1.Injectable)()
], ContactInfoExtractorService);
//# sourceMappingURL=contact-info-extractor.service.js.map