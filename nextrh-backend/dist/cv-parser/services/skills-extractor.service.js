"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsExtractorService = void 0;
const common_1 = require("@nestjs/common");
const cv_parser_constants_1 = require("../constants/cv-parser.constants");
const validation_util_1 = require("../utils/validation.util");
let SkillsExtractorService = class SkillsExtractorService {
    extract(sectionText, fullTextFallback) {
        const matchedSkills = new Set();
        const sectionHasContent = sectionText && sectionText.trim().length > 0;
        const targetText = sectionHasContent ? sectionText : (fullTextFallback ?? '');
        if (!targetText || targetText.trim().length === 0) {
            return [];
        }
        for (const kw of cv_parser_constants_1.TECH_KEYWORDS) {
            const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            if (new RegExp(`\\b${escaped}\\b`, 'i').test(targetText)) {
                matchedSkills.add(kw);
            }
        }
        if (sectionHasContent) {
            const dynamicTokens = this.segmentSkillsSection(sectionText);
            for (const token of dynamicTokens) {
                if (this.shouldKeepSkillToken(token)) {
                    const formatted = this.formatSkillToken(token);
                    matchedSkills.add(formatted);
                }
            }
        }
        return Array.from(matchedSkills);
    }
    segmentSkillsSection(sectionText) {
        const cleanText = sectionText
            .replace(/^(Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills)[:\s\-\–\.]*/i, '')
            .trim();
        const lines = cleanText.split(/[\n;•●▪\*\|\r:\/]/);
        const rawTokens = [];
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0)
                continue;
            if (trimmedLine.includes(',')) {
                const commaTokens = trimmedLine.split(',').map(t => t.trim());
                rawTokens.push(...commaTokens);
            }
            else {
                rawTokens.push(trimmedLine);
            }
        }
        return rawTokens;
    }
    isValid(data) {
        return (0, validation_util_1.isSkillsSectionValid)(data);
    }
    formatSkillToken(str) {
        const clean = str.replace(/^[-\–\.\*•●▪\s\(\)]+|[-\–\.\*•●▪\s\(\)]+$/g, '').trim();
        if (clean === clean.toUpperCase())
            return clean;
        return clean
            .split(/\s+/)
            .map(word => {
            if (cv_parser_constants_1.SKILL_STOP_WORDS.has(word.toLowerCase()))
                return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
            .join(' ');
    }
    shouldKeepSkillToken(token) {
        const cleanToken = token.replace(/^[-\–\.\*•●▪\s\(\)]+|[-\–\.\*•●▪\s\(\)]+$/g, '').trim();
        if (cleanToken.length < 2 || cleanToken.length > 40)
            return false;
        const words = cleanToken.split(/\s+/);
        if (words.length > 4)
            return false;
        if (/^\d+$/.test(cleanToken) || /^\d{4}/.test(cleanToken))
            return false;
        if (words.length === 1 && cv_parser_constants_1.SKILL_STOP_WORDS.has(cleanToken.toLowerCase())) {
            return false;
        }
        if (!/[a-zA-Zà-ÿ]/i.test(cleanToken))
            return false;
        return true;
    }
};
exports.SkillsExtractorService = SkillsExtractorService;
exports.SkillsExtractorService = SkillsExtractorService = __decorate([
    (0, common_1.Injectable)()
], SkillsExtractorService);
//# sourceMappingURL=skills-extractor.service.js.map