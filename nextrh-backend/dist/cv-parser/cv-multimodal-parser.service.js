"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CvMultimodalParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvMultimodalParserService = void 0;
const common_1 = require("@nestjs/common");
const perf_hooks_1 = require("perf_hooks");
const llm_interface_1 = require("../llm/llm.interface");
const cv_schema_1 = require("./schema/cv.schema");
let CvMultimodalParserService = CvMultimodalParserService_1 = class CvMultimodalParserService {
    constructor(llmEngine) {
        this.llmEngine = llmEngine;
        this.logger = new common_1.Logger(CvMultimodalParserService_1.name);
    }
    async parseCvPdf(fileBuffer) {
        const globalStart = perf_hooks_1.performance.now();
        const base64Pdf = fileBuffer.toString('base64');
        const prompt = `You are an expert HR data extraction assistant.
Extract all professional information from the attached PDF CV document.

Rules:
- Extract ALL information present in the document without omission.
- Do NOT translate any terms. Keep original names, titles, and dates as written.
- For dates: keep the original format found in the document (e.g. "Février 2020", "2018-2022").
- For missing fields: use null for strings, empty array [] for arrays.
- Skills: extract individual technology and tool names as separate items ONLY from a dedicated, visible skills or competencies section
- For certifications without explicit dates: set date to null.
- Extract all projects with their client names and technical descriptions.

PDF DOCUMENT:
[The attached document contains the CV to parse]`;
        const llmStart = perf_hooks_1.performance.now();
        const result = await this.llmEngine.generateStructured(prompt, cv_schema_1.CvSchema, undefined, {
            type: 'document',
            mediaType: 'application/pdf',
            data: base64Pdf,
        });
        const llmInferenceMs = perf_hooks_1.performance.now() - llmStart;
        const totalMs = Math.round(perf_hooks_1.performance.now() - globalStart);
        this.logger.log(`Gemini multimodal CV parse complete in ${(totalMs / 1000).toFixed(2)}s`);
        return this.mapToResponse(result, totalMs, Math.round(llmInferenceMs), base64Pdf.length);
    }
    mapToResponse(result, totalMs, llmMs, charCount) {
        return {
            status: 'success',
            execution_metrics: {
                total_time_ms: totalMs,
                heuristic_time_ms: 0,
                llm_inference_ms: llmMs,
                fallback_triggered: false,
                character_count: charCount,
                parser_mode: 'gemini_multimodal',
            },
            data: {
                profile: {
                    name: result.full_name,
                    profession: result.profession,
                    phone: result.phone,
                    fax: result.fax,
                    email: result.email,
                    address: result.address,
                    skills: result.skills ?? [],
                },
                experience: (result.experiences ?? []).map(e => ({
                    period: e.period ?? null,
                    company: e.company,
                    role: e.role,
                    lowConfidence: false,
                })),
                certifications: (result.certifications ?? []).map(c => ({
                    certName: c.cert_name,
                    provider: c.provider,
                    date: c.date ?? null,
                    issue_date: c.date ?? null,
                    expiry_date: null,
                    lowConfidence: false,
                })),
                education: (result.education ?? []).map(e => ({
                    year: e.year ?? null,
                    institution: e.institution,
                    degree: e.degree,
                    lowConfidence: false,
                })),
                projects: (result.projects ?? []).map(p => ({
                    year: p.year ?? null,
                    client: p.client,
                    description: p.description,
                    lowConfidence: false,
                })),
            },
        };
    }
};
exports.CvMultimodalParserService = CvMultimodalParserService;
exports.CvMultimodalParserService = CvMultimodalParserService = CvMultimodalParserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_interface_1.LLM_ENGINE)),
    __metadata("design:paramtypes", [Object])
], CvMultimodalParserService);
//# sourceMappingURL=cv-multimodal-parser.service.js.map