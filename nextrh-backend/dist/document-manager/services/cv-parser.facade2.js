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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CvParserFacade2_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvParserFacade2 = void 0;
const common_1 = require("@nestjs/common");
const cv_heuristic_parser_service_1 = require("./cv-heuristic-parser.service");
const ocr_service_1 = require("./ocr.service");
const ollama_1 = require("@langchain/ollama");
const cv_extraction_schema1_1 = require("../cv-extraction.schema1");
const perf_hooks_1 = require("perf_hooks");
const compromise_1 = __importDefault(require("compromise"));
let CvParserFacade2 = CvParserFacade2_1 = class CvParserFacade2 {
    constructor(heuristicParser, ocrService) {
        this.heuristicParser = heuristicParser;
        this.ocrService = ocrService;
        this.logger = new common_1.Logger(CvParserFacade2_1.name);
        this.CONFIDENCE_THRESHOLD = 0.8;
        this.llmModel = new ollama_1.ChatOllama({
            baseUrl: 'http://localhost:11434',
            model: 'qwen2.5:7b',
            temperature: 0.1,
            numCtx: 4096,
            numPredict: 2048,
        }).withStructuredOutput(cv_extraction_schema1_1.CvExtractionSchema);
    }
    async parseScannedCv(fileBuffer) {
        const globalStartTime = perf_hooks_1.performance.now();
        this.logger.log('⏱️ Starting Dedicated Scanned PDF Parser Pipeline (CvParserFacade2)...');
        const ocrStartTime = perf_hooks_1.performance.now();
        const rawText = await this.ocrService.extractTextFromPdf(fileBuffer, 'fra+eng');
        const ocrDurationMs = Math.round(perf_hooks_1.performance.now() - ocrStartTime);
        this.logger.log(`⚙️ OCR extraction complete in ${ocrDurationMs} ms. Running text sanitization...`);
        const cleanedText = rawText
            .replace(/-- \d+ of \d+ --/g, '')
            .replace(/([-–])\s*\n\s*/g, '$1 ')
            .replace(/---\s*Page\s*\d+\s*---/gi, '')
            .replace(/Page\s*\d+\s*---/gi, '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
        const sections = this.heuristicParser.segmentText(cleanedText);
        const heuristicStartTime = perf_hooks_1.performance.now();
        const result = this.heuristicParser.parse(cleanedText, 1, 25, 'Scanned_CV.pdf');
        const heuristicDuration = perf_hooks_1.performance.now() - heuristicStartTime;
        this.logger.log(`⚡ Heuristics parsed in ${heuristicDuration.toFixed(2)} ms.`);
        let fallbackTriggered = false;
        let llmInferenceTimeMs = 0;
        const isExperienceInvalid = result.experiences.length === 0 ||
            result.experiences.some((exp) => {
                const confidence = this.calculateExperienceConfidence(exp);
                this.logger.log(`📊 Experience confidence score for "${exp.company}": ${confidence.toFixed(2)}`);
                return confidence < this.CONFIDENCE_THRESHOLD;
            });
        if (isExperienceInvalid && sections.experience && sections.experience.trim().length > 50) {
            this.logger.warn('⚠️ Heuristic Experience extraction failed quality gate. Triggering Qwen fallback...');
            this.logger.log(`📝 Raw text passed to the LLM [EXPERIENCES]:\n"""\n${sections.experience}\n"""`);
            const llmStart = perf_hooks_1.performance.now();
            const llmData = await this.runTargetedLlmFallback('experiences', sections.experience);
            if (llmData && llmData.experiences && llmData.experiences.length > 0) {
                result.experiences = llmData.experiences.map((exp) => ({
                    company: exp.company,
                    role: exp.role,
                    period: exp.period || null,
                    start_date: null,
                    end_date: null,
                    description: exp.description || exp.role
                }));
                fallbackTriggered = true;
            }
            llmInferenceTimeMs += (perf_hooks_1.performance.now() - llmStart);
        }
        const isCertificationInvalid = result.certifications.length === 0 ||
            result.certifications.some((cert) => !cert.cert_name || cert.cert_name.trim().length < 5);
        if (isCertificationInvalid && sections.certification && sections.certification.trim().length > 50) {
            this.logger.warn('⚠️ Heuristic Certification extraction failed quality gate. Triggering Qwen fallback...');
            this.logger.log(`📝 Raw text passed to the LLM [CERTIFICATIONS]:\n"""\n${sections.certification}\n"""`);
            const llmStart = perf_hooks_1.performance.now();
            const llmData = await this.runTargetedLlmFallback('certifications', sections.certification);
            if (llmData && llmData.certifications && llmData.certifications.length > 0) {
                result.certifications = llmData.certifications.map((cert) => ({
                    cert_name: cert.cert_name,
                    provider: cert.provider || 'Professional Issuer',
                    date: cert.date || null,
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
            this.logger.warn('⚠️ Heuristic Education extraction failed quality gate. Triggering Qwen fallback...');
            this.logger.log(`📝 Raw text passed to the LLM [EDUCATION]:\n"""\n${sections.education}\n"""`);
            const llmStart = perf_hooks_1.performance.now();
            const llmData = await this.runTargetedLlmFallback('education', sections.education);
            if (llmData && llmData.education && llmData.education.length > 0) {
                result.education = llmData.education.map((edu) => ({
                    degree: edu.degree,
                    institution: edu.institution,
                    year: edu.year || null,
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
            this.logger.warn('⚠️ Heuristic Projects extraction failed quality gate. Triggering Qwen fallback...');
            this.logger.log(`📝 Raw text passed to the LLM [PROJECTS]:\n"""\n${sections.projects}\n"""`);
            const llmStart = perf_hooks_1.performance.now();
            const llmData = await this.runTargetedLlmFallback('projects', sections.projects);
            if (llmData && llmData.projects && llmData.projects.length > 0) {
                result.projects = llmData.projects.map((proj) => ({
                    name: proj.client,
                    client: proj.client,
                    role: 'Consultant / Intervenant',
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
        this.logger.log(`⏱️ Dedicated pipeline processed in ${(totalDurationMs / 1000).toFixed(2)} seconds.`);
        return {
            status: 'success',
            execution_metrics: {
                total_time_ms: totalDurationMs,
                ocr_time_ms: ocrDurationMs,
                heuristic_time_ms: Math.round(heuristicDuration),
                llm_inference_ms: Math.round(llmInferenceTimeMs),
                is_scanned_pdf: true,
                fallback_triggered: fallbackTriggered,
                character_count: cleanedText.length
            },
            data: {
                contact: {
                    name: result.full_name,
                    profession: result.profession,
                    phone: result.phone,
                    fax: result.fax,
                    email: result.email,
                    address: result.address,
                    skills: result.skills
                },
                experience: result.experiences.map((exp) => ({
                    period: exp.period || null,
                    company: exp.company,
                    role: exp.role
                })),
                certifications: result.certifications.map((cert) => ({
                    certName: cert.cert_name,
                    date: cert.date || null
                })),
                education: result.education.map((edu) => ({
                    year: edu.year || null,
                    institution: edu.institution,
                    degree: edu.degree
                })),
                projects: result.projects.map((proj) => ({
                    year: proj.year || null,
                    client: proj.client,
                    description: proj.description
                }))
            }
        };
    }
    calculateExperienceConfidence(exp) {
        let score = 1.0;
        const companyWords = exp.company ? exp.company.trim().split(/\s+/) : [];
        const roleWords = exp.role ? exp.role.trim().split(/\s+/) : [];
        if (companyWords.length === 0 || roleWords.length === 0)
            return 0.0;
        if (companyWords.length > 5)
            score -= 0.3;
        if (exp.role.trim().length < 5)
            score -= 0.3;
        const companyDoc = (0, compromise_1.default)(exp.company);
        if (companyDoc.verbs().length > 0) {
            score -= 0.3;
        }
        const hasPreposition = companyDoc.prepositions().length > 0;
        if (hasPreposition && companyWords.length <= 2) {
            score -= 0.3;
        }
        const roleKeywords = ['chef', 'manager', 'engineer', 'ingénieur', 'consultant', 'administrator', 'administrateur', 'technicien', 'developer', 'développeur', 'infrastructure'];
        const containsRoleKeyword = companyWords.some(w => roleKeywords.includes(w.toLowerCase()));
        if (containsRoleKeyword) {
            score -= 0.4;
        }
        return Math.max(0, score);
    }
    async runTargetedLlmFallback(sectionName, textBlock) {
        const prompt = `
You are an expert CV parsing assistant.
Task: Extract ONLY the ${sectionName.toUpperCase()} details from the provided text block.

Rules:
- Only parse details belonging to the requested section: "${sectionName}".
- Set all other unrelated fields (like full_name, email, address, skills, other sections) to null or empty arrays [].
- Extract ALL items from this specific text without omission.
- Do NOT translate terms. Keep original names and dates as written.
- If a date is missing, set its value strictly to null.

TEXT BLOCK TO PARSE:
---
${textBlock}
---
    `;
        try {
            return (await this.llmModel.invoke(prompt));
        }
        catch (error) {
            this.logger.error(`Local Qwen fallback failed for section ${sectionName}: ${error.message}`);
            return null;
        }
    }
};
exports.CvParserFacade2 = CvParserFacade2;
exports.CvParserFacade2 = CvParserFacade2 = CvParserFacade2_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_heuristic_parser_service_1.CvHeuristicParserService,
        ocr_service_1.OcrService])
], CvParserFacade2);
//# sourceMappingURL=cv-parser.facade2.js.map