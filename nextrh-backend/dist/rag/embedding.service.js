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
exports.EmbeddingService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let EmbeddingService = class EmbeddingService {
    constructor() {
        this.ollamaUrl = 'http://127.0.0.1:11434/api/embeddings';
    }
    async embed(text) {
        try {
            const cleanText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
            const safeText = cleanText.length > 3000 ? cleanText.substring(0, 3000) : cleanText;
            const res = await axios_1.default.post(this.ollamaUrl, {
                model: 'nomic-embed-text',
                prompt: safeText,
            }, { timeout: 30000 });
            return res.data.embedding || [];
        }
        catch (err) {
            const errorMsg = err.response?.data?.error || err.message;
            console.error(`Erreur Embedding Ollama: ${errorMsg}`);
            return [];
        }
    }
};
exports.EmbeddingService = EmbeddingService;
exports.EmbeddingService = EmbeddingService = __decorate([
    (0, common_1.Injectable)()
], EmbeddingService);
//# sourceMappingURL=embedding.service.js.map