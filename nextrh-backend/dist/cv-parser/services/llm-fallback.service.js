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
var LlmFallbackService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmFallbackService = void 0;
const common_1 = require("@nestjs/common");
const llm_interface_1 = require("../../llm/llm.interface");
const cv_schema_1 = require("../schema/cv.schema");
const schemaMap = {
    certifications: cv_schema_1.CertificationsFallbackSchema,
    projects: cv_schema_1.ProjectsFallbackSchema,
    experiences: cv_schema_1.ExperiencesFallbackSchema,
    education: cv_schema_1.EducationFallbackSchema,
};
let LlmFallbackService = LlmFallbackService_1 = class LlmFallbackService {
    constructor(llmEngine) {
        this.llmEngine = llmEngine;
        this.logger = new common_1.Logger(LlmFallbackService_1.name);
    }
    async runFallback(sectionKey, textBlock) {
        const schema = schemaMap[sectionKey] ?? cv_schema_1.CvSchema;
        const prompt = `You are an expert CV parsing assistant.
Task: Extract ONLY the ${sectionKey.toUpperCase()} details from the text block below.

Rules:
- Extract ONLY details belonging to the "${sectionKey}" section.
- Extract ALL items without omission.
- Do NOT translate terms. Keep original names and dates as written.
- For certification dates: if no explicit date exists, set "date" to null.

TEXT BLOCK:
---
${textBlock}
---`;
        try {
            const response = await this.llmEngine.generateStructured(prompt, schema);
            return response?.[sectionKey] ?? null;
        }
        catch (err) {
            this.logger.error(`LLM fallback failed for section "${sectionKey}": ${err.message}`);
            return null;
        }
    }
};
exports.LlmFallbackService = LlmFallbackService;
exports.LlmFallbackService = LlmFallbackService = LlmFallbackService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_interface_1.LLM_ENGINE)),
    __metadata("design:paramtypes", [Object])
], LlmFallbackService);
//# sourceMappingURL=llm-fallback.service.js.map