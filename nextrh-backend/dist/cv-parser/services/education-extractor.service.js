"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationExtractorService = void 0;
const common_1 = require("@nestjs/common");
const validation_util_1 = require("../utils/validation.util");
let EducationExtractorService = class EducationExtractorService {
    extract(sectionText) {
        const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const education = [];
        let currentYear = '';
        let block = [];
        for (const line of rawLines) {
            if (/^\s*(Année|Période)\s+Institution\s+Diplôme\s*$/i.test(line))
                continue;
            const yearMatch = line.match(/^(\d{4}(?:\s*[-–]\s*\d{4})?)\b\s*(.*)$/);
            if (yearMatch) {
                if (currentYear && block.length > 0) {
                    education.push(this.parseEducationBlock(currentYear, block));
                }
                currentYear = yearMatch[1].trim();
                block = yearMatch[2].trim() ? [yearMatch[2].trim()] : [];
            }
            else {
                block.push(line);
            }
        }
        if (currentYear && block.length > 0) {
            education.push(this.parseEducationBlock(currentYear, block));
        }
        return education;
    }
    parseEducationBlock(yearStr, lines) {
        const text = lines.join(' ').replace(/\s+/g, ' ').trim();
        const degreeMatch = text.match(/\b(Diplôme|Licence|Baccalauréat|Classes préparatoires|Classes|Ingénieur|Master|Doctorat|Option|Technicien)\b/i);
        let institution = '';
        let degree = '';
        if (degreeMatch?.index !== undefined) {
            institution = text.substring(0, degreeMatch.index).trim();
            degree = text.substring(degreeMatch.index).trim();
        }
        else {
            institution = text;
        }
        institution = institution.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
        degree = degree.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
        const parts = yearStr.split(/[-–]/);
        const endYear = parts.length >= 2 ? parseInt(parts[1].trim(), 10) : parseInt(yearStr, 10);
        const startYear = parts.length >= 2 ? parseInt(parts[0].trim(), 10) : null;
        return { degree, institution, year: yearStr, start_year: startYear, end_year: endYear };
    }
    isValid(data) {
        return (0, validation_util_1.isEducationSectionValid)(data);
    }
};
exports.EducationExtractorService = EducationExtractorService;
exports.EducationExtractorService = EducationExtractorService = __decorate([
    (0, common_1.Injectable)()
], EducationExtractorService);
//# sourceMappingURL=education-extractor.service.js.map