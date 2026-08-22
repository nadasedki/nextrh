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
var PromptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let PromptService = PromptService_1 = class PromptService {
    constructor() {
        this.logger = new common_1.Logger(PromptService_1.name);
        this.promptTemplate = '';
        this.PROMPT_PATH = path.join(process.cwd(), 'src/assets/prompts/rag-prompt.md');
        this.OUTPUT_SCHEMA = {
            type: 'object',
            properties: {
                reasoning: {
                    type: 'string',
                    description: 'Step-by-step validation of each candidate against the conditions in the question.',
                },
                answer: {
                    type: 'string',
                    description: 'Final candidate name(s). If no single candidate meets all conditions, write "No candidate satisfies all criteria."',
                },
                explanation: {
                    type: 'string',
                    description: 'One sentence summarizing why this conclusion was reached.',
                },
                confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    description: 'Confidence score between 0 and 1.',
                },
                sources: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of document references used to reach the answer.',
                },
            },
            required: [
                'reasoning',
                'answer',
                'explanation',
                'confidence',
                'sources',
            ],
        };
    }
    onModuleInit() {
        try {
            this.promptTemplate = fs.readFileSync(this.PROMPT_PATH, 'utf-8');
            this.logger.log('RAG prompt template loaded from disk.');
        }
        catch (err) {
            this.logger.error(`Failed to load prompt template from ${this.PROMPT_PATH}: ${err.message}. ` +
                `Using minimal fallback.`);
            this.promptTemplate = 'FACTS:\n{context}\n\nQUESTION:\n{question}';
        }
    }
    build(question, chunks) {
        const validChunks = (chunks || []).filter(c => c?.payload &&
            typeof c.payload.text === 'string' &&
            c.payload.text.trim().length > 0);
        if (validChunks.length === 0) {
            this.logger.warn(`No valid chunks for query: "${question}" — LLM will receive empty context`);
        }
        const context = validChunks
            .map((c, i) => {
            const candidate = c.payload.full_name || 'Unknown';
            const section = c.payload.type || 'profile';
            return `[DOC ${i + 1}] (Candidat: ${candidate} | Section: ${section})\n${c.payload.text}`;
        })
            .join('\n\n');
        return this.promptTemplate
            .replace('{context}', context)
            .replace('{question}', question);
    }
};
exports.PromptService = PromptService;
exports.PromptService = PromptService = PromptService_1 = __decorate([
    (0, common_1.Injectable)()
], PromptService);
//# sourceMappingURL=prompt.service.js.map