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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const ollama_1 = require("@langchain/ollama");
const certification_schema_1 = require("./certification.schema");
let LlmService = class LlmService {
    constructor() {
        this.model = new ollama_1.ChatOllama({
            baseUrl: 'http://localhost:11434',
            model: 'qwen2.5:7b',
            temperature: 0,
        }).withStructuredOutput(certification_schema_1.CertificationSchema);
    }
    async extractCertificate(fullText) {
        const prompt = `
Extract certificate data from this text.

Rules:

- Use exact certificate names from the text
- Do NOT invent anything
- Keep provider and dates as-is
- If missing, return null

Return structured output only.

Text:

"""

${fullText}

"""

`;
        try {
            const result = await this.model.invoke(prompt);
            console.log('✔ Structured output:', result);
            return result;
        }
        catch (error) {
            console.error('❌ LLM error:', error);
            return {
                error: 'Structured extraction failed',
            };
        }
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LlmService);
//# sourceMappingURL=llm.service.js.map