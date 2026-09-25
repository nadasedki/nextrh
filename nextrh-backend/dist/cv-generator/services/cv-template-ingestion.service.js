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
var CvTemplateIngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvTemplateIngestionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cv_template_entity_1 = require("../entities/cv-template.entity");
const llm_interface_1 = require("../../llm/llm.interface");
const cv_template_schema_1 = require("../cv-template.schema");
const fs = __importStar(require("fs/promises"));
let CvTemplateIngestionService = CvTemplateIngestionService_1 = class CvTemplateIngestionService {
    constructor(templateRepo, llmEngine) {
        this.templateRepo = templateRepo;
        this.llmEngine = llmEngine;
        this.logger = new common_1.Logger(CvTemplateIngestionService_1.name);
    }
    async ingestTemplateFromDisk(fullDiskPath, relativePdfPath, name, userId) {
        this.logger.log(`[AI Ingestion] Analyzing PDF layout for: "${name}"`);
        try {
            const fileBuffer = await fs.readFile(fullDiskPath);
            const attachment = {
                type: 'document',
                mediaType: 'application/pdf',
                data: fileBuffer.toString('base64'),
            };
            const prompt = `You are an expert Senior Document Integration Engineer.
Analyze the exact visual layout, color scheme, spacing, borders, and margins of the attached CV template PDF.
Reconstruct this design into a clean, responsive HTML/CSS skeleton template.

Rules:
1. Use Flexbox or CSS Grid. Do NOT use absolute positioning or fixed heights.
2. Embed all CSS in a <style> block. Include page-break-inside: avoid on repeated blocks and table rows.
3. For all content fields, use clear, descriptive brackets to represent where data belongs (e.g., [Nom Complet], [Poste], [Date de naissance], [Situation familiale], [Date de recrutement], [Nombre d'années d'expérience], [Dernier diplôme], [Année d'obtention], [Profil et connaissances]).
4. For list-based or tabular sections (like experiences, projects, educations, or certifications), generate a semantic HTML structure or table. Render 2 or 3 empty skeleton rows containing descriptive brackets (e.g., [Date 1], [Rôle 1], [Entreprise 1], [Description 1]) to visually demonstrate how list items repeat and align.
5. If a field is visually meant for manual-entry, signature, or a mission role (e.g. "Signature", "Fonction à assurer dans la mission"), preserve the labels but leave their value areas blank with dotted lines (e.g., "..............").
6. Return ONLY the HTML skeleton. No explanation, no markdown.`;
            const result = await this.llmEngine.generateStructured(prompt, cv_template_schema_1.cvTemplateHtmlSchema, {}, attachment);
            const skeleton = result.html;
            const newTemplate = this.templateRepo.create({
                name,
                template_html: skeleton,
                original_pdf_url: relativePdfPath,
                created_by: userId,
            });
            const saved = await this.templateRepo.save(newTemplate);
            this.logger.log(`[AI Ingestion] Template saved with ID: ${saved.id}`);
            return { templateId: saved.id, skeleton };
        }
        catch (error) {
            await fs.unlink(fullDiskPath).catch(() => { });
            this.logger.error(`[AI Ingestion] Failed: ${error.message}`);
            throw new common_1.InternalServerErrorException(`Template ingestion failed: ${error.message}`);
        }
    }
};
exports.CvTemplateIngestionService = CvTemplateIngestionService;
exports.CvTemplateIngestionService = CvTemplateIngestionService = CvTemplateIngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cv_template_entity_1.CvTemplate)),
    __param(1, (0, common_1.Inject)(llm_interface_1.LLM_ENGINE)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], CvTemplateIngestionService);
//# sourceMappingURL=cv-template-ingestion.service.js.map