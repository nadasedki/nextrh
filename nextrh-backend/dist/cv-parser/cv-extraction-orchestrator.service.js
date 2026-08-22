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
var CvExtractionOrchestrator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvExtractionOrchestrator = void 0;
const common_1 = require("@nestjs/common");
const perf_hooks_1 = require("perf_hooks");
const pdf_parser_service_1 = require("./services/pdf-parser.service");
const text_segmentation_service_1 = require("./services/text-segmentation.service");
const cv_heuristic_extraction_service_1 = require("./cv-heuristic-extraction.service");
const llm_fallback_service_1 = require("./services/llm-fallback.service");
const certification_extractor_service_1 = require("./services/certification-extractor.service");
const education_extractor_service_1 = require("./services/education-extractor.service");
const project_extractor_service_1 = require("./services/project-extractor.service");
const experience_extractor_service_1 = require("./services/experience-extractor.service");
const text_cleaning_util_1 = require("./utils/text-cleaning.util");
let CvExtractionOrchestrator = CvExtractionOrchestrator_1 = class CvExtractionOrchestrator {
    constructor(pdfParser, segmenter, heuristicextraction, llmFallback, certExtractor, eduExtractor, projExtractor, expExtractor) {
        this.pdfParser = pdfParser;
        this.segmenter = segmenter;
        this.heuristicextraction = heuristicextraction;
        this.llmFallback = llmFallback;
        this.certExtractor = certExtractor;
        this.eduExtractor = eduExtractor;
        this.projExtractor = projExtractor;
        this.expExtractor = expExtractor;
        this.logger = new common_1.Logger(CvExtractionOrchestrator_1.name);
    }
    async parseCv(fileBuffer) {
        const start = perf_hooks_1.performance.now();
        this.logger.log('Starting Hybrid CV parsing execution (Heuristic + Targeted LLM Parallel Fallbacks)...');
        const rawText = await this.pdfParser.extractRawText(fileBuffer);
        const cleaned = (0, text_cleaning_util_1.cleanRawText)(rawText);
        const sections = this.segmenter.segmentText(cleaned);
        const hStart = perf_hooks_1.performance.now();
        const result = this.heuristicextraction.parse(cleaned);
        const hDurationMs = perf_hooks_1.performance.now() - hStart;
        let fallbackTriggered = false;
        let llmInferenceMs = 0;
        const experiences = { data: result.experiences, source: 'heuristic', lowConfidence: false };
        const certifications = { data: result.certifications, source: 'heuristic', lowConfidence: false };
        const education = { data: result.education, source: 'heuristic', lowConfidence: false };
        const projects = { data: result.projects, source: 'heuristic', lowConfidence: false };
        const fallbackPromises = [];
        const llmStart = perf_hooks_1.performance.now();
        if (!this.expExtractor.isValid(result.experiences) && (sections.experience ?? '').trim().length > 50) {
            fallbackPromises.push((async () => {
                this.logger.warn('Experience quality check failed — dispatching LLM fallback');
                const llmData = await this.llmFallback.runFallback('experiences', sections.experience);
                if (llmData && llmData.length > 0) {
                    experiences.data = llmData.map((e) => ({
                        company: e.company,
                        role: e.role,
                        period: e.period ?? 'N/A',
                        start_date: null,
                        end_date: null,
                        description: e.description ?? e.role,
                    }));
                    experiences.source = 'llm';
                    fallbackTriggered = true;
                }
                else {
                    experiences.lowConfidence = true;
                }
            })());
        }
        if (!this.certExtractor.isValid(result.certifications) && (sections.certification ?? '').trim().length > 50) {
            fallbackPromises.push((async () => {
                this.logger.warn('Certification quality check failed — dispatching LLM fallback');
                const llmData = await this.llmFallback.runFallback('certifications', sections.certification);
                if (llmData && llmData.length > 0) {
                    certifications.data = llmData.map((c) => ({
                        cert_name: c.cert_name,
                        provider: c.provider ?? 'Professional Issuer',
                        date: c.date ?? null,
                        issue_date: null,
                        expiry_date: null,
                    }));
                    certifications.source = 'llm';
                    fallbackTriggered = true;
                }
                else {
                    certifications.lowConfidence = true;
                }
            })());
        }
        if (!this.eduExtractor.isValid(result.education) && (sections.education ?? '').trim().length > 50) {
            fallbackPromises.push((async () => {
                this.logger.warn('Education quality check failed — dispatching LLM fallback');
                const llmData = await this.llmFallback.runFallback('education', sections.education);
                if (llmData && llmData.length > 0) {
                    education.data = llmData.map((e) => ({
                        degree: e.degree,
                        institution: e.institution,
                        year: e.year ?? 'N/A',
                        start_year: null,
                        end_year: null,
                    }));
                    education.source = 'llm';
                    fallbackTriggered = true;
                }
                else {
                    education.lowConfidence = true;
                }
            })());
        }
        if (!this.projExtractor.isValid(result.projects) && (sections.projects ?? '').trim().length > 50) {
            fallbackPromises.push((async () => {
                this.logger.warn('Projects quality check failed — dispatching LLM fallback');
                const llmData = await this.llmFallback.runFallback('projects', sections.projects);
                if (llmData && llmData.length > 0) {
                    projects.data = llmData.map((p) => ({
                        name: p.client,
                        client: p.client,
                        role: 'N/A',
                        description: p.description,
                        start_date: null,
                        end_date: null,
                        year: p.year ?? null,
                    }));
                    projects.source = 'llm';
                    fallbackTriggered = true;
                }
                else {
                    projects.lowConfidence = true;
                }
            })());
        }
        if (fallbackPromises.length > 0) {
            await Promise.all(fallbackPromises);
            llmInferenceMs = perf_hooks_1.performance.now() - llmStart;
        }
        const totalTimeMs = Math.round(perf_hooks_1.performance.now() - start);
        this.logger.log(`Hybrid pipeline successfully completed in ${(totalTimeMs / 1000).toFixed(2)}s ` +
            `(heuristics: ${Math.round(hDurationMs)}ms, llm: ${Math.round(llmInferenceMs)}ms, ` +
            `fallback: ${fallbackTriggered})`);
        return {
            status: 'success',
            execution_metrics: {
                total_time_ms: totalTimeMs,
                heuristic_time_ms: Math.round(hDurationMs),
                llm_inference_ms: Math.round(llmInferenceMs),
                fallback_triggered: fallbackTriggered,
                character_count: cleaned.length,
            },
            data: {
                profile: {
                    name: result.full_name,
                    profession: result.profession,
                    phone: result.phone,
                    fax: result.fax,
                    email: result.email,
                    address: result.address,
                    skills: result.skills,
                },
                experience: experiences.data.map((e) => ({
                    period: e.period,
                    company: e.company,
                    role: e.role,
                    lowConfidence: experiences.lowConfidence,
                })),
                certifications: certifications.data.map((c) => ({
                    certName: c.cert_name,
                    provider: c.provider,
                    date: c.date ?? null,
                    issue_date: c.issue_date ?? null,
                    expiry_date: c.expiry_date ?? null,
                    lowConfidence: certifications.lowConfidence,
                })),
                education: education.data.map((e) => ({
                    year: e.year,
                    institution: e.institution,
                    degree: e.degree,
                    lowConfidence: education.lowConfidence,
                })),
                projects: projects.data.map((p) => ({
                    year: p.year ?? null,
                    client: p.client,
                    description: p.description,
                    lowConfidence: projects.lowConfidence,
                })),
            },
        };
    }
};
exports.CvExtractionOrchestrator = CvExtractionOrchestrator;
exports.CvExtractionOrchestrator = CvExtractionOrchestrator = CvExtractionOrchestrator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pdf_parser_service_1.PdfParserService,
        text_segmentation_service_1.TextSegmentationService,
        cv_heuristic_extraction_service_1.CvHeuristicextractionService,
        llm_fallback_service_1.LlmFallbackService,
        certification_extractor_service_1.CertificationExtractorService,
        education_extractor_service_1.EducationExtractorService,
        project_extractor_service_1.ProjectExtractorService,
        experience_extractor_service_1.ExperienceExtractorService])
], CvExtractionOrchestrator);
//# sourceMappingURL=cv-extraction-orchestrator.service.js.map