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
var CvParserFacade_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvParserFacade = void 0;
const common_1 = require("@nestjs/common");
const cv_heuristic_parser_service_1 = require("./cv-heuristic-parser.service");
const pdf_parser_service_1 = require("./pdf-parser.service");
const ollama_1 = require("@langchain/ollama");
const perf_hooks_1 = require("perf_hooks");
const cv_extraction_schema_1 = require("../cv-extraction.schema");
let CvParserFacade = CvParserFacade_1 = class CvParserFacade {
    constructor(heuristicParser, pdfParserService) {
        this.heuristicParser = heuristicParser;
        this.pdfParserService = pdfParserService;
        this.logger = new common_1.Logger(CvParserFacade_1.name);
        this.llmModel = new ollama_1.ChatOllama({
            baseUrl: 'http://localhost:11434',
            model: 'qwen2.5:3b-instruct-q4_K_M',
            temperature: 0.1,
            numCtx: 4096,
            numPredict: 2048,
        });
    }
    async parseCv(fileBuffer) {
        const globalStartTime = perf_hooks_1.performance.now();
        this.logger.log(' Starting Hybrid (Heuristic + Quality-Gated LLM Fallback) Parser...');
        const rawText = await this.pdfParserService.extractRawText(fileBuffer);
        const cleanedText = rawText
            .replace(/-- \d+ of \d+ --/g, '')
            .replace(/([-–])\s*\n\s*/g, '$1 ')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
        const sections = this.heuristicParser.segmentText(cleanedText);
        const heuristicStartTime = perf_hooks_1.performance.now();
        const result = this.heuristicParser.parse(cleanedText, 1, 25, 'CV_Buffer.pdf');
        const heuristicDuration = perf_hooks_1.performance.now() - heuristicStartTime;
        this.logger.log(` Heuristic parsed in ${heuristicDuration.toFixed(2)} ms.`);
        let fallbackTriggered = false;
        let llmInferenceTimeMs = 0;
        const isExperienceInvalid = result.experiences.length === 0 ||
            result.experiences.some((exp) => !exp.company || exp.company === 'Inconnu' || !exp.role || exp.role.trim().length < 3);
        if (isExperienceInvalid && sections.experience && sections.experience.trim().length > 50) {
            this.logger.warn(' Heuristic Experience failed quality gate. Triggering Qwen fallback...');
            this.logger.log(` Raw text passed to the LLM [EXPERIENCES]:\n"""\n${sections.experience}\n"""`);
            const llmStart = perf_hooks_1.performance.now();
            const llmData = await this.runTargetedLlmFallback('experiences', sections.experience);
            if (llmData && llmData.experiences && llmData.experiences.length > 0) {
                result.experiences = llmData.experiences.map((exp) => ({
                    company: exp.company,
                    role: exp.role,
                    period: exp.period || 'Date à préciser',
                    start_date: null,
                    end_date: null,
                    description: exp.description || exp.role
                }));
                fallbackTriggered = true;
            }
            llmInferenceTimeMs += (perf_hooks_1.performance.now() - llmStart);
        }
        const isCertificationInvalid = result.certifications.length === 0 ||
            result.certifications.some((cert) => {
                const name = (cert.cert_name || cert.certName || '').trim();
                if (name.length < 3)
                    return true;
                const isTooLong = name.length > 120;
                const wordCount = name.split(/\s+/).length;
                const hasTooManyWords = wordCount > 15;
                const punctuationCount = (name.match(/[:\-\-|•●▪]/g) || []).length;
                const hasTooManySeparators = punctuationCount > 2;
                return isTooLong || hasTooManyWords || hasTooManySeparators;
            });
        if (isCertificationInvalid && sections.certification && sections.certification.trim().length > 50) {
            this.logger.warn(' Heuristic Certification failed quality gate. Triggering Qwen fallback...');
            this.logger.log(` Raw text passed to the LLM [CERTIFICATIONS]:\n"""\n${sections.certification}\n"""`);
            const llmStart = perf_hooks_1.performance.now();
            const llmData = await this.runTargetedLlmFallback('certifications', sections.certification);
            if (llmData && llmData.certifications && llmData.certifications.length > 0) {
                result.certifications = llmData.certifications.map((cert) => ({
                    cert_name: cert.cert_name,
                    provider: cert.provider || 'Professional Issuer',
                    date: cert.date || 'Date à préciser',
                    issue_date: null,
                    expiry_date: null
                }));
                fallbackTriggered = true;
            }
            llmInferenceTimeMs += (perf_hooks_1.performance.now() - llmStart);
        }
        const isEducationInvalid = result.education.length === 0 ||
            result.education.some((edu) => !edu.institution || !edu.degree || edu.degree.trim().length < 5);
        if (isEducationInvalid && sections.education && sections.education.trim().length > 50) {
            this.logger.warn(' Heuristic Education failed quality gate. Triggering Qwen fallback...');
            this.logger.log(` Raw text passed to the LLM [EDUCATION]:\n"""\n${sections.education}\n"""`);
            const llmStart = perf_hooks_1.performance.now();
            const llmData = await this.runTargetedLlmFallback('education', sections.education);
            if (llmData && llmData.education && llmData.education.length > 0) {
                result.education = llmData.education.map((edu) => ({
                    degree: edu.degree,
                    institution: edu.institution,
                    year: edu.year || 'Date à préciser',
                    start_year: null,
                    end_year: null
                }));
                fallbackTriggered = true;
            }
            llmInferenceTimeMs += (perf_hooks_1.performance.now() - llmStart);
        }
        const isProjectInvalid = result.projects.length === 0 ||
            result.projects.some((proj) => !proj.client || proj.client === 'Inconnu' || !proj.description || proj.description.trim().length < 10);
        if (isProjectInvalid && sections.projects && sections.projects.trim().length > 50) {
            this.logger.warn(' Heuristic Projects failed quality gate. Triggering Qwen fallback...');
            this.logger.log(` Raw text passed to the LLM [PROJECTS]:\n"""\n${sections.projects}\n"""`);
            const llmStart = perf_hooks_1.performance.now();
            const llmData = await this.runTargetedLlmFallback('projects', sections.projects);
            if (llmData && llmData.projects && llmData.projects.length > 0) {
                result.projects = llmData.projects.map((proj) => ({
                    name: proj.client,
                    client: proj.client,
                    role: 'N/A',
                    description: proj.description,
                    end_date: null,
                    start_date: null,
                    year: proj.year || null
                }));
                fallbackTriggered = true;
            }
            llmInferenceTimeMs += (perf_hooks_1.performance.now() - llmStart);
        }
        const totalDurationMs = Math.round(perf_hooks_1.performance.now() - globalStartTime);
        this.logger.log(` Hybrid pipeline processed in ${(totalDurationMs / 1000).toFixed(2)} seconds.`);
        return {
            status: 'success',
            execution_metrics: {
                total_time_ms: totalDurationMs,
                heuristic_time_ms: Math.round(heuristicDuration),
                llm_inference_ms: Math.round(llmInferenceTimeMs),
                fallback_triggered: fallbackTriggered,
                character_count: cleanedText.length
            },
            data: {
                profile: {
                    name: result.full_name,
                    profession: result.profession,
                    phone: result.phone,
                    fax: result.fax,
                    email: result.email,
                    address: result.address,
                    skills: result.skills
                },
                experience: result.experiences.map((exp) => ({
                    period: exp.period || 'Date à préciser',
                    company: exp.company,
                    role: exp.role
                })),
                certifications: result.certifications.map((cert) => ({
                    certName: cert.cert_name,
                    date: cert.date || 'Date à préciser'
                })),
                education: result.education.map((edu) => ({
                    year: edu.year,
                    institution: edu.institution,
                    degree: edu.degree
                })),
                projects: result.projects.map((proj) => ({
                    year: proj.year,
                    client: proj.client,
                    description: proj.description
                }))
            }
        };
    }
    async runTargetedLlmFallback(sectionName, textBlock) {
        let targetSchema;
        if (sectionName === 'certifications')
            targetSchema = cv_extraction_schema_1.CertificationsFallbackSchema;
        else if (sectionName === 'projects')
            targetSchema = cv_extraction_schema_1.ProjectsFallbackSchema;
        else if (sectionName === 'experiences')
            targetSchema = cv_extraction_schema_1.ExperiencesFallbackSchema;
        else if (sectionName === 'education')
            targetSchema = cv_extraction_schema_1.EducationFallbackSchema;
        else
            targetSchema = cv_extraction_schema_1.CvExtractionSchema;
        const prompt = `
You are an expert CV parsing assistant.
Task: Extract ONLY the ${sectionName.toUpperCase()} details from the provided text block.

Rules:
- Only parse details belonging to the requested section: "${sectionName}".
- Extract ALL items from this specific text without omission.
- Do NOT translate terms. Keep original names and dates as written.

TEXT BLOCK TO PARSE:
---
${textBlock}
---`;
        try {
            const modelWithStructure = this.llmModel.withStructuredOutput(targetSchema);
            const response = await modelWithStructure.invoke(prompt);
            return response;
        }
        catch (error) {
            this.logger.error(`Local Qwen fallback failed for section ${sectionName}: ${error.message}`);
            return null;
        }
    }
};
exports.CvParserFacade = CvParserFacade;
exports.CvParserFacade = CvParserFacade = CvParserFacade_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_heuristic_parser_service_1.CvHeuristicParserService,
        pdf_parser_service_1.PdfParserService])
], CvParserFacade);
//# sourceMappingURL=cv-parser.facade.js.map