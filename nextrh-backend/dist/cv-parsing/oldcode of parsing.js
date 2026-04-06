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
var CvParsingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvParsingService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const pdfjs = require("pdfjs-dist/legacy/build/pdf");
const pdf_extractor_service_1 = require("./pdf-extractor/pdf-extractor.service");
const heuristic_parser_service_1 = require("./heuristic-parser/heuristic-parser.service");
const llm_service_1 = require("./llm/llm.service");
const cv_service_1 = require("../cvs/cv.service");
const education_service_1 = require("../education/education.service");
const certifications_service_1 = require("../certifications/certifications.service");
const project_service_1 = require("../project/project.service");
const experience_service_1 = require("../experience/experience.service");
let CvParsingService = CvParsingService_1 = class CvParsingService {
    constructor(pdfExtractor, heuristicParser, llmService, cvService, educationService, certificationsService, projectsService, experienceService) {
        this.pdfExtractor = pdfExtractor;
        this.heuristicParser = heuristicParser;
        this.llmService = llmService;
        this.cvService = cvService;
        this.educationService = educationService;
        this.certificationsService = certificationsService;
        this.projectsService = projectsService;
        this.experienceService = experienceService;
        this.logger = new common_1.Logger(CvParsingService_1.name);
    }
    async processPdf(pdfPath, employeeId) {
        const rawText = await this.pdfExtractor.extractRawText(pdfPath);
        console.log("RAW TEXT EXTRACTED:", rawText);
        const result = await this.parseEntireCv(rawText);
        const savedCv = await this.cvService.saveIdentityCv(employeeId, pdfPath, result);
        await this.educationService.createParsedEducation(result.education, employeeId, savedCv);
        await this.certificationsService.createBulkFromParsedData(result.certifications, employeeId, pdfPath, savedCv);
        await this.projectsService.createBulkFromParsedData(result.projects, employeeId, savedCv);
        await this.experienceService.createBulkFromParsedData(result.experience, employeeId, savedCv);
        return result;
    }
    async extractTextFromPdf(pdfPath) {
        if (!fs.existsSync(pdfPath))
            throw new common_1.NotFoundException('Fichier PDF introuvable');
        try {
            const data = new Uint8Array(fs.readFileSync(pdfPath));
            const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true, disableFontFace: true });
            const pdf = await loadingTask.promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item) => item.str).join(' ');
                fullText += pageText + '\n';
            }
            console.log("RAW  OUTPUT:", fullText);
            return fullText;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Erreur lecture PDF');
        }
    }
    async parseEntireCv(rawText) {
        const cleanRaw = rawText
            .replace(/[\t]/g, ' ')
            .replace(/\s{3,}/g, '  ')
            .trim();
        const sections = this.splitSections(cleanRaw);
        return {
            contact: this.heuristicParser.extractContactInfo(sections.header, cleanRaw),
            experience: this.heuristicParser.extractExperience(sections.experience || ''),
            certifications: this.heuristicParser.extractCertifications(sections.certifications || ''),
            education: this.heuristicParser.extractEducation(sections.education || ''),
            projects: this.heuristicParser.extractProjects(sections.projects || ''),
            skills: this.heuristicParser.extractSkills(sections.skills || ''),
        };
    }
    splitSections(text) {
        const sectionMap = {
            experience: /(?:Expérience[s]?\s*professionnelle[s]?|Parcours\s*professionnel)/i,
            certifications: /(?:Certification[s]?|Certificat[s]?|Diplômes\s*et\s*Certificats)/i,
            education: /(?:Formation[s]?|Éducation|Cursus|Parcours\s*académique)/i,
            projects: /(?<!Chef\sde\s|Directeur\sde\s)\bProjet[s]?\b(?:\s*[:\n•]|\s{2,}|(?=\s+\d{4}))/i,
            skills: /\b(?:Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills|Aptitude[s]?|Savoir-faire)\b/i,
        };
        const markers = Object.entries(sectionMap)
            .map(([key, regex]) => {
            const match = text.match(regex);
            return { key, index: match ? match.index : -1 };
        })
            .filter(m => m.index !== -1)
            .sort((a, b) => a.index - b.index);
        const result = { header: '' };
        result.header = text.substring(0, markers[0]?.index || text.length);
        for (let i = 0; i < markers.length; i++) {
            const start = markers[i].index;
            const end = markers[i + 1]?.index || text.length;
            result[markers[i].key] = text.substring(start, end);
        }
        return result;
    }
    isSectionInvalid(key, data) {
        if (!data)
            return true;
        if (Array.isArray(data) && data.length === 0)
            return true;
        switch (key) {
            case 'contact':
                return !data.email || !data.name;
            case 'projects':
                const unknowns = data.filter(p => p.client === 'Inconnu').length;
                return unknowns > data.length / 2;
            default:
                return false;
        }
    }
};
exports.CvParsingService = CvParsingService;
exports.CvParsingService = CvParsingService = CvParsingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pdf_extractor_service_1.PdfExtractorService,
        heuristic_parser_service_1.HeuristicParserService,
        llm_service_1.LlmService,
        cv_service_1.CvService,
        education_service_1.EducationService,
        certifications_service_1.CertificationsService,
        project_service_1.ProjectService,
        experience_service_1.ExperienceService])
], CvParsingService);
//# sourceMappingURL=oldcode%20of%20parsing.js.map