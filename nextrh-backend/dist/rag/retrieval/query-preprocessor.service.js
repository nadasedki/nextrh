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
var QueryPreprocessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryPreprocessorService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ACRONYM_MAP = {
    'ccnp': 'Cisco Certified Network Professional',
    'ccna': 'Cisco Certified Network Associate',
    'ccie': 'Cisco Certified Internetwork Expert',
    'mcsa': 'Microsoft Certified Solutions Associate',
    'mcse': 'Microsoft Certified Solutions Expert',
    'rhce': 'Red Hat Certified Engineer',
    'rhcsa': 'Red Hat Certified System Administrator',
    'aws': 'Amazon Web Services',
    'gcp': 'Google Cloud Platform',
    'azure': 'Microsoft Azure',
    'devops': 'development operations',
    'rh': 'ressources humaines',
    'si': 'système information',
    'lan': 'local area network',
    'wan': 'wide area network',
    'vpn': 'virtual private network',
    'ids': 'intrusion detection system',
    'ips': 'intrusion prevention system',
    'siem': 'security information event management',
    'pki': 'public key infrastructure',
    'ad': 'active directory',
    'erp': 'enterprise resource planning',
    'crm': 'customer relationship management',
};
let QueryPreprocessorService = QueryPreprocessorService_1 = class QueryPreprocessorService {
    constructor() {
        this.logger = new common_1.Logger(QueryPreprocessorService_1.name);
        this.stopWords = new Set();
        this.STOP_WORDS_PATH = path.join(process.cwd(), 'src/rag/reranking/config/stop-words.json');
    }
    onModuleInit() {
        try {
            const raw = fs.readFileSync(this.STOP_WORDS_PATH, 'utf-8');
            const config = JSON.parse(raw);
            this.stopWords = new Set(config.words);
            this.logger.log(`Stop-words loaded for query preprocessing: ${this.stopWords.size} words`);
        }
        catch (error) {
            this.logger.error(`Could not load stop-words file: ${error.message}. Preprocessing without filtering.`);
        }
    }
    preprocess(question) {
        const original = question.trim();
        const normalized = original
            .toLowerCase()
            .replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s]/gi, '')
            .trim();
        const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
        const expandedTerms = [];
        const processedTokens = [];
        for (const token of tokens) {
            if (ACRONYM_MAP[token]) {
                expandedTerms.push(ACRONYM_MAP[token]);
                processedTokens.push(token);
                processedTokens.push(ACRONYM_MAP[token]);
                this.logger.debug(`Expanded acronym: "${token}" → "${ACRONYM_MAP[token]}"`);
            }
            else if (!this.stopWords.has(token)) {
                processedTokens.push(token);
            }
        }
        const cleaned = processedTokens.length > 0
            ? processedTokens.join(' ')
            : original;
        this.logger.debug(`Query preprocessed: "${original}" → "${cleaned}"`);
        return { cleaned, expandedTerms };
    }
    getMeaningfulTokens(question) {
        const { cleaned } = this.preprocess(question);
        return cleaned.split(/\s+/).filter(t => t.length > 1);
    }
};
exports.QueryPreprocessorService = QueryPreprocessorService;
exports.QueryPreprocessorService = QueryPreprocessorService = QueryPreprocessorService_1 = __decorate([
    (0, common_1.Injectable)()
], QueryPreprocessorService);
//# sourceMappingURL=query-preprocessor.service.js.map