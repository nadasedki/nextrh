"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceExtractorService = void 0;
const common_1 = require("@nestjs/common");
const date_util_1 = require("../utils/date.util");
const validation_util_1 = require("../utils/validation.util");
let ExperienceExtractorService = class ExperienceExtractorService {
    extract(sectionText) {
        const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const combined = [];
        const dateStartRegex = /^(Depuis|Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|\b[a-zA-Zà-ÿ]+\s+\d{4}|\b\d{4}\s*[-–]\s*\d{4}|\b\d{4}\b)/i;
        for (const line of rawLines) {
            if (/^\s*Période\s+Organisme\s+Fonction\s+occupée\s*$/i.test(line))
                continue;
            if (dateStartRegex.test(line)) {
                combined.push(line);
            }
            else if (combined.length > 0) {
                combined[combined.length - 1] += ` ${line}`;
            }
            else {
                combined.push(line);
            }
        }
        const dateRangeRegex = /^((?:Depuis\s+)?[a-zA-Zà-ÿ]+\s+\d{4}(?:\s*[-–]\s*[a-zA-Zà-ÿ]+\s+\d{4})?|\b\d{4}\s*[-–]\s*\d{4}\b|\b\d{4}\b)\s+(.+)$/i;
        return combined
            .map(line => this.parseExperienceLine(line, dateRangeRegex))
            .filter((e) => e !== null);
    }
    parseExperienceLine(line, dateRangeRegex) {
        const match = line.match(dateRangeRegex);
        if (!match)
            return null;
        const dateStr = match[1].trim();
        const remaining = match[2].trim();
        let company = 'Inconnu';
        let role = remaining;
        const parts = remaining.split(/\t|\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length >= 2) {
            company = parts[0];
            role = parts.slice(1).join(' ');
        }
        else {
            const words = remaining.split(/\s+/);
            company = words.slice(0, 2).join(' ');
            role = words.slice(2).join(' ');
        }
        return {
            company,
            role,
            period: dateStr,
            start_date: (0, date_util_1.parseDateRangeStart)(dateStr),
            end_date: (0, date_util_1.parseDateRangeEnd)(dateStr),
            description: role,
        };
    }
    isValid(data) {
        return (0, validation_util_1.isExperienceSectionValid)(data);
    }
};
exports.ExperienceExtractorService = ExperienceExtractorService;
exports.ExperienceExtractorService = ExperienceExtractorService = __decorate([
    (0, common_1.Injectable)()
], ExperienceExtractorService);
//# sourceMappingURL=experience-extractor.service.js.map