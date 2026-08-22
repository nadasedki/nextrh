"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectExtractorService = void 0;
const common_1 = require("@nestjs/common");
const cv_parser_constants_1 = require("../constants/cv-parser.constants");
const date_util_1 = require("../utils/date.util");
const validation_util_1 = require("../utils/validation.util");
let ProjectExtractorService = class ProjectExtractorService {
    constructor() {
        this.PROJECT_DATE_REGEX = /^(?:(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4}(?:\s*[-–]\s*(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4})?|\d{4}(?:\s*[-–]\s*\d{4})?)\b/i;
        this.projectSplitRegex = new RegExp(`\\b(${cv_parser_constants_1.PROJECT_ACTION_KEYWORDS.join('|')})\\b`, 'i');
    }
    extract(sectionText) {
        const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const combined = [];
        for (const line of rawLines) {
            if (/^\s*Année\s+Client\s+Projet\s*$/i.test(line))
                continue;
            if (/Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills/i.test(line))
                break;
            if (this.PROJECT_DATE_REGEX.test(line)) {
                combined.push(line);
            }
            else if (combined.length > 0) {
                combined[combined.length - 1] += ` ${line}`;
            }
            else {
                combined.push(line);
            }
        }
        return combined
            .map(line => this.parseProjectLine(line))
            .filter((p) => p !== null);
    }
    parseProjectLine(line) {
        const dateMatch = line.match(this.PROJECT_DATE_REGEX);
        if (!dateMatch)
            return null;
        const dateStr = dateMatch[0].trim();
        const payload = line.substring(dateStr.length).trim();
        const years = dateStr.match(/\b\d{4}\b/g) ?? [];
        const startYear = years.length >= 1 ? parseInt(years[0], 10) : new Date().getFullYear();
        const endYear = years.length >= 2 ? parseInt(years[1], 10) : startYear;
        let client = payload;
        let description = '';
        const actionMatch = payload.match(this.projectSplitRegex);
        if (actionMatch?.index !== undefined) {
            client = payload.substring(0, actionMatch.index).trim();
            description = payload.substring(actionMatch.index).trim();
        }
        else {
            const words = payload.split(/\s+/);
            if (words.length > 3) {
                client = words.slice(0, 3).join(' ');
                description = words.slice(3).join(' ');
            }
        }
        client = client.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
        description = description.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
        return {
            name: client || 'Client Inconnu',
            client: client || 'Client Inconnu',
            role: 'Consultant / Intervenant',
            description: description || client,
            start_date: null,
            end_date: (0, date_util_1.parseYearToEndDate)(endYear.toString()),
            year: dateStr,
        };
    }
    isValid(data) {
        return (0, validation_util_1.isProjectSectionValid)(data);
    }
};
exports.ProjectExtractorService = ProjectExtractorService;
exports.ProjectExtractorService = ProjectExtractorService = __decorate([
    (0, common_1.Injectable)()
], ProjectExtractorService);
//# sourceMappingURL=project-extractor.service.js.map