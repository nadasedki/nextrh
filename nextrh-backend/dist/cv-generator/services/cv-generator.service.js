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
var CvGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const cv_template_service_1 = require("./cv-template.service");
const cv_data_formatter_service_1 = require("./cv-data-formatter.service");
const pdf_generator_service_1 = require("./pdf-generator.service");
const llm_interface_1 = require("../../llm/llm.interface");
const cv_template_schema_1 = require("../cv-template.schema");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let CvGeneratorService = CvGeneratorService_1 = class CvGeneratorService {
    constructor(templateService, dataFormatter, pdfGenerator, llmEngine, configService, cvGenerationQueue) {
        this.templateService = templateService;
        this.dataFormatter = dataFormatter;
        this.pdfGenerator = pdfGenerator;
        this.llmEngine = llmEngine;
        this.configService = configService;
        this.cvGenerationQueue = cvGenerationQueue;
        this.logger = new common_1.Logger(CvGeneratorService_1.name);
        const configuredPath = this.configService.get('UPLOAD_GENERATED_DESTINATION') || './uploads/generated';
        this.generatedOutputDir = path.isAbsolute(configuredPath)
            ? configuredPath
            : path.join(process.cwd(), configuredPath);
    }
    async enqueueCvGeneration(templateId, userId) {
        const job = await this.cvGenerationQueue.add('generate-cv', { templateId, userId }, {
            attempts: 2,
            removeOnComplete: { age: 3600, count: 500 },
            removeOnFail: { age: 86400 },
        });
        return {
            status: 'queued',
            message: 'CV generation started in the background.',
            jobId: job.id,
        };
    }
    async getGenerationJobStatus(jobId) {
        const job = await this.cvGenerationQueue.getJob(jobId);
        if (!job)
            return { jobId, state: 'completed', status: 'completed', progress: 100 };
        const state = await job.getState();
        return {
            jobId: job.id,
            state,
            progress: job.progress,
            result: job.returnvalue || null,
            failedReason: job.failedReason || null,
        };
    }
    async compileSkeleton(skeleton, candidate) {
        this.logger.log(`Compiling skeleton for candidate: ${candidate.full_name}`);
        const prompt = `You are an expert Document Compiler.
You receive:
1. A styled HTML skeleton template containing descriptive brackets (e.g., [Nom Complet], [Date de naissance], and empty table rows like [Date 1], [Description 1]).
2. A raw Candidate JSON dataset.

Your task is to compile the Candidate JSON data directly into the HTML template, intelligently replacing the descriptive brackets with formatted candidate data, and return the completed HTML.

Rules:
1. SEMANTIC MATCHING: Analyze the descriptive brackets and labels inside the HTML skeleton. Map them semantically to the closest matching data inside the Candidate JSON, regardless of the language or exact wording.
2. DYNAMIC TABLE RESOLUTION: 
   - Replicate and expand the HTML table rows or list containers to match the number of items in the candidate's history arrays (experiences, projects, educations, etc.).
   - Map candidate 'experiences' strictly to tables/sections representing standard professional employment history.
   - Map candidate 'projects' strictly to tables/sections representing projects, references, or similar missions. Do NOT mix or duplicate these datasets.
   - Prevent data duplication across adjacent columns. For example, in tables with both "Projet" and "Client" columns, map the detailed 'description' to the project column and the company/client name to the client column.
3. DYNAMIC CALCULATION:
   - "Dernier diplôme" / "Année d'obtention": Inspect the candidate's 'education' array, identify the most recent degree based on the dates, and write it in.
   - "Date de recrutement": Map this dynamically using the start date of the candidate's most recent work experience.
   - "Nombre d'années d'expérience": Calculate the total sum of years of experience based on the candidate's experience periods.
   - "Profil et connaissances": Synthesize a professional, flowing summary paragraph combining the candidate's 'profession' and their 'skills' list.
4. CONDITIONAL OMISSION: If a visual metadata field or row (e.g., birth_date, marital_status) has no value in the Candidate JSON, completely remove that entire line or row from the HTML — do not leave blank spaces or empty brackets.
5. For manual-only fields (Signature, Fonction à assurer): keep the field label, leave the value blank with dotted lines.
6. DATE FORMATTING: Format all raw date strings into clean, human-readable dates matching the language of the template (e.g., "Janvier 2015" for French, "January 2015" for English).
7. Return only the complete HTML. No explanation, no markdown.

HTML SKELETON:
${skeleton}

CANDIDATE DATA:
${JSON.stringify(candidate, null, 2)}`;
        const result = await this.llmEngine.generateStructured(prompt, cv_template_schema_1.cvTemplateHtmlSchema);
        this.logger.log(`Stage 2 Compiled HTML Length: ${result?.html?.length || 0} characters`);
        return result.html;
    }
    getGeneratedFilePath(fileName) {
        const safeFileName = path.basename(fileName);
        return path.join(this.generatedOutputDir, safeFileName);
    }
    async compileAndRenderPdf(templateId, userId) {
        this.logger.log(`Compiling PDF CV for Candidate #${userId} with Template #${templateId}...`);
        try {
            const skeleton = await this.templateService.getSkeleton(templateId);
            const candidateData = await this.dataFormatter.getFormattedCandidateData(userId);
            const populatedHtml = await this.compileSkeleton(skeleton, candidateData);
            const pdfBuffer = await this.pdfGenerator.generate(populatedHtml);
            await fs.mkdir(this.generatedOutputDir, { recursive: true });
            const fileName = `generated-cv-${userId}-${Date.now()}.pdf`;
            const fullDiskPath = path.join(this.generatedOutputDir, fileName);
            await fs.writeFile(fullDiskPath, pdfBuffer);
            return {
                downloadUrl: `http://localhost:3000/cv/download/${fileName}`,
                fileName,
            };
        }
        catch (err) {
            this.logger.error(`CV generation failed: ${err.message}`);
            throw new common_1.InternalServerErrorException(`CV generation failed: ${err.message}`);
        }
    }
};
exports.CvGeneratorService = CvGeneratorService;
exports.CvGeneratorService = CvGeneratorService = CvGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(llm_interface_1.LLM_ENGINE)),
    __param(5, (0, bullmq_1.InjectQueue)('cv-generation')),
    __metadata("design:paramtypes", [cv_template_service_1.CvTemplateService,
        cv_data_formatter_service_1.CvDataFormatterService,
        pdf_generator_service_1.PdfGeneratorService, Object, config_1.ConfigService,
        bullmq_2.Queue])
], CvGeneratorService);
//# sourceMappingURL=cv-generator.service.js.map