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
var RerankingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RerankingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const llm_interface_1 = require("../../llm/llm.interface");
const RERANKING_SCHEMA = {
    type: 'object',
    properties: {
        ranked_ids: {
            type: 'array',
            items: { type: 'number' },
            description: 'List of the input sequential document IDs, sorted strictly by semantic relevance to the query, highest relevance first.',
        }
    },
    required: ['ranked_ids']
};
let RerankingService = RerankingService_1 = class RerankingService {
    constructor(llmEngine, configService) {
        this.llmEngine = llmEngine;
        this.configService = configService;
        this.logger = new common_1.Logger(RerankingService_1.name);
        this.stopWords = new Set();
        this.LAMBDA = 0.15;
        this.STOP_WORDS_PATH = path.join(process.cwd(), 'src/rag/reranking/config/stop-words.json');
        this.topK = this.configService.get('RERANKER_TOP_K', 5);
    }
    onModuleInit() {
        try {
            if (fs.existsSync(this.STOP_WORDS_PATH)) {
                const raw = fs.readFileSync(this.STOP_WORDS_PATH, 'utf-8');
                const config = JSON.parse(raw);
                this.stopWords = new Set(config.words);
                this.logger.log(`Stop-words loaded: ${this.stopWords.size} words (${config.metadata.languages.join(', ')})`);
            }
            else {
                this.logger.warn(`Stop-words file missing at ${this.STOP_WORDS_PATH}. Lexical fallback will run unfiltered.`);
            }
        }
        catch (error) {
            this.logger.error(`Could not initialize stop-words catalog: ${error.message}.`);
            this.stopWords = new Set();
        }
    }
    async rerank(question, results, topK) {
        const k = topK ?? this.topK;
        if (!results || results.length === 0) {
            return [];
        }
        try {
            return await this.geminiRerank(question, results, k);
        }
        catch (err) {
            this.logger.warn(`[RERANKER] Gemini evaluation failed: ${err.message}. ` +
                `Gracefully degrading to local Lexical Booster...`);
            try {
                return this.lexicalRerank(question, results, k);
            }
            catch (lexicalErr) {
                this.logger.error(`[RERANKER] Local Lexical fallback failed: ${lexicalErr.message}. Falling back to raw vector order.`);
                return [...results]
                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                    .slice(0, k);
            }
        }
    }
    async geminiRerank(question, results, topK) {
        const docSelectionBlock = results
            .map((res) => `[ID: ${res.id}] Content: ${res.payload?.text || ''}`)
            .join('\n\n');
        const prompt = `You are an expert Information Retrieval (IR) semantic reranking system.

Query: "${question}"

Below is a list of candidate document chunks retrieved from a vector database. 
Evaluate each chunk's semantic relevance to the user's Query. 
Sort the document IDs from most relevant to least relevant. Return ONLY the sorted list of IDs.

CANDIDATE DOCUMENTS:
---
${docSelectionBlock}
---`;
        const response = await this.llmEngine.generateStructured(prompt, RERANKING_SCHEMA, {
            model: 'gemini-2.5-flash',
            temperature: 0,
        });
        const rankedIds = response?.ranked_ids || [];
        this.logger.log(`[RERANKER] Gemini reordered candidate chunk priority: [${rankedIds.join(', ')}]`);
        const mappedResults = new Map(results.map(r => [r.id, r]));
        const sortedResults = [];
        for (const id of rankedIds) {
            const matchedRecord = mappedResults.get(id);
            if (matchedRecord) {
                sortedResults.push({
                    ...matchedRecord,
                    score: 1.0 - (sortedResults.length * 0.05),
                });
            }
        }
        for (const res of results) {
            if (!rankedIds.includes(res.id)) {
                sortedResults.push({
                    ...res,
                    score: res.score || 0,
                });
            }
        }
        return sortedResults.slice(0, topK);
    }
    lexicalRerank(question, results, topK) {
        const rawTokens = question
            .toLowerCase()
            .replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s]/gi, '')
            .split(/\s+/)
            .filter(t => t.length > 0);
        const meaningfulTokens = rawTokens.filter(t => !this.stopWords.has(t));
        this.logger.debug(`[RERANKER-LEXICAL] Extracted tokens: [${meaningfulTokens.join(', ')}]`);
        if (meaningfulTokens.length === 0) {
            this.logger.warn('No meaningful tokens — ranking by vector score only.');
            return [...results]
                .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                .slice(0, topK);
        }
        const reranked = results.map(result => {
            const docText = (result.payload?.text ?? '').toLowerCase();
            const vectorScore = result.score ?? 0;
            let uniqueTermsMatched = 0;
            for (const token of meaningfulTokens) {
                const escaped = token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                if (new RegExp(`\\b${escaped}\\b`, 'gi').test(docText)) {
                    uniqueTermsMatched++;
                }
            }
            const coverageBoost = uniqueTermsMatched / meaningfulTokens.length;
            const hybridScore = vectorScore + (this.LAMBDA * coverageBoost);
            return { ...result, score: hybridScore };
        });
        return reranked
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
};
exports.RerankingService = RerankingService;
exports.RerankingService = RerankingService = RerankingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_interface_1.LLM_ENGINE)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], RerankingService);
//# sourceMappingURL=reranking.service.js.map