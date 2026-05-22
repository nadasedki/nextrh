"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let LlmService = class LlmService {
    async extractCertificate(fullText) {
        const prompt = `
Extract certificate data from this text as JSON. 
Use the exact certificate title (do not invent generic names).
Return ONLY valid JSON.

Fields:
- certificate_name
- certificate_holder
- provider
- date_of_obtention
- date_of_expiration (null if missing)

Text:
"""${fullText}"""
`;
        const response = await axios_1.default.post('http://localhost:11434/api/chat', {
            model: 'qwen2.5:3b-instruct-q4_K_M',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            stream: false,
        });
        const raw = response.data.message.content;
        console.log("RAW LLM OUTPUT:", raw);
        const cleaned = raw.replace(/```json|```/g, '').trim();
        let parsedJson = JSON.parse(cleaned);
        if (Array.isArray(parsedJson)) {
            console.log("⚠️ [Pipeline Warning] Detected LLM array output wrappers. Auto-unwrapping payload...");
            parsedJson = parsedJson[0];
        }
        try {
            console.error("llm clean output :", cleaned);
            return parsedJson;
        }
        catch (err) {
            console.error("JSON PARSE ERROR:", err);
            return { error: "Invalid JSON from LLM", raw };
        }
    }
};
exports.LlmService = LlmService;
exports.LlmService = LlmService = __decorate([
    (0, common_1.Injectable)()
], LlmService);
//# sourceMappingURL=llm.service.js.map