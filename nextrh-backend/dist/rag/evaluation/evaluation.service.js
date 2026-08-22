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
var EvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const common_1 = require("@nestjs/common");
const rag_pipeline_service_1 = require("../application/rag-pipeline.service");
const embedding_service_1 = require("../embedding/embedding.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let EvaluationService = EvaluationService_1 = class EvaluationService {
    constructor(pipeline, embeddingService) {
        this.pipeline = pipeline;
        this.embeddingService = embeddingService;
        this.logger = new common_1.Logger(EvaluationService_1.name);
        this.ROUGE_SUCCESS_THRESHOLD = 0.5;
        this.FAITHFULNESS_SUCCESS_THRESHOLD = 0.7;
        this.SEMANTIC_SUCCESS_THRESHOLD = 0.75;
        this.GROUND_TRUTH_PATH = path.join(process.cwd(), 'test/data/rag_ground_truth.json');
        this.OUTPUT_PATH = path.join(process.cwd(), 'uploads/rag_metrics_report.json');
    }
    getTestCase(index) {
        if (!fs.existsSync(this.GROUND_TRUTH_PATH))
            return null;
        const gt = JSON.parse(fs.readFileSync(this.GROUND_TRUTH_PATH, 'utf-8'));
        return gt.test_cases?.[index] ?? null;
    }
    getAllTestCases() {
        if (!fs.existsSync(this.GROUND_TRUTH_PATH))
            return [];
        const gt = JSON.parse(fs.readFileSync(this.GROUND_TRUTH_PATH, 'utf-8'));
        return gt.test_cases ?? [];
    }
    async runEvaluationSuite() {
        this.logger.log('Starting RAG evaluation suite...');
        if (!fs.existsSync(this.GROUND_TRUTH_PATH)) {
            throw new Error(`Ground truth file not found at ${this.GROUND_TRUTH_PATH}`);
        }
        const testCases = this.getAllTestCases();
        this.logger.log('Pre-computing expected answer embeddings...');
        const expectedEmbeddings = new Map();
        for (const tc of testCases) {
            if (!expectedEmbeddings.has(tc.expected_answer)) {
                const vec = await this.embeddingService.embed(tc.expected_answer);
                expectedEmbeddings.set(tc.expected_answer, vec);
            }
        }
        const details = [];
        let totalP3 = 0, totalR3 = 0, totalP5 = 0, totalR5 = 0;
        let totalMRR = 0, totalRougeL = 0, totalFaithfulness = 0;
        let totalSemantic = 0, totalSuccess = 0;
        let totalMRRNoRerank = 0, totalP3NoRerank = 0;
        for (const testCase of testCases) {
            this.logger.log(`Evaluating [${testCase.category}]: "${testCase.query}"`);
            try {
                const state = await this.pipeline.run(testCase.query);
                const answerOnly = state.structuredAnswer?.answer ?? state.answer ?? '';
                const textForFaithfulness = answerOnly;
                const retrievedDocIds = state.reranked.map(r => {
                    const userId = r.payload?.user_id ?? '';
                    const type = r.payload?.type ?? '';
                    return `${userId}_${type}`;
                });
                const retrievedContextText = state.reranked
                    .map(r => r.payload?.text ?? '')
                    .filter(t => t.length > 0)
                    .join('\n');
                const evalInput = {
                    query: testCase.query,
                    expectedDocIds: testCase.expected_doc_ids,
                    retrievedDocIds,
                    expectedAnswer: testCase.expected_answer,
                    generatedAnswer: answerOnly,
                    retrievedContextText,
                };
                const expectedVec = expectedEmbeddings.get(testCase.expected_answer);
                const metrics = await this.evaluate(evalInput, textForFaithfulness, expectedVec);
                totalP3 += metrics.precisionAt3;
                totalR3 += metrics.recallAt3;
                totalP5 += metrics.precisionAt5;
                totalR5 += metrics.recallAt5;
                totalMRR += metrics.mrr;
                totalRougeL += metrics.rougeLScore;
                totalFaithfulness += metrics.faithfulnessScore;
                totalSemantic += metrics.semanticSimilarityScore;
                if (metrics.success)
                    totalSuccess++;
                const stateNoRerank = await this.pipeline.runWithoutReranking(testCase.query);
                const noRerankDocIds = stateNoRerank.reranked.map(r => {
                    const userId = r.payload?.user_id ?? '';
                    const type = r.payload?.type ?? '';
                    return `${userId}_${type}`;
                });
                totalMRRNoRerank += this.calculateMRR(noRerankDocIds, testCase.expected_doc_ids);
                totalP3NoRerank += this.calculatePrecisionAtK(noRerankDocIds, testCase.expected_doc_ids, 3);
                details.push({
                    query: testCase.query,
                    category: testCase.category,
                    metrics,
                    generated_answer: answerOnly,
                    expected_answer: testCase.expected_answer,
                    retrieved_sources_ids: retrievedDocIds,
                });
            }
            catch (err) {
                this.logger.error(`Failed to evaluate "${testCase.query}": ${err.message}`);
            }
        }
        const count = testCases.length || 1;
        const byCategory = {};
        for (const d of details) {
            const cat = d.category ?? 'uncategorized';
            if (!byCategory[cat])
                byCategory[cat] = [];
            byCategory[cat].push(d);
        }
        const categoryBreakdown = {};
        for (const [cat, entries] of Object.entries(byCategory)) {
            const n = entries.length;
            categoryBreakdown[cat] = {
                count: n,
                avgMRR: parseFloat((entries.reduce((s, e) => s + e.metrics.mrr, 0) / n).toFixed(4)),
                avgPrecisionAt3: parseFloat((entries.reduce((s, e) => s + e.metrics.precisionAt3, 0) / n).toFixed(4)),
                avgRecallAt3: parseFloat((entries.reduce((s, e) => s + e.metrics.recallAt3, 0) / n).toFixed(4)),
                avgRougeL: parseFloat((entries.reduce((s, e) => s + e.metrics.rougeLScore, 0) / n).toFixed(4)),
                avgSemanticSimilarity: parseFloat((entries.reduce((s, e) => s + e.metrics.semanticSimilarityScore, 0) / n).toFixed(4)),
            };
        }
        const globalMRR = totalMRR / count;
        const globalP3 = totalP3 / count;
        const globalMRRNoRerank = totalMRRNoRerank / count;
        const globalP3NoRerank = totalP3NoRerank / count;
        const report = {
            evaluatedAt: new Date().toISOString(),
            successCriteria: {
                faithfulnessThreshold: this.FAITHFULNESS_SUCCESS_THRESHOLD,
                rougeLThreshold: this.ROUGE_SUCCESS_THRESHOLD,
                semanticThreshold: this.SEMANTIC_SUCCESS_THRESHOLD,
                logic: 'faithfulness >= 0.7 AND (rougeL >= 0.5 OR semantic >= 0.75)',
            },
            summary: {
                totalQueriesEvaluated: count,
                globalPrecisionAt3: parseFloat(globalP3.toFixed(4)),
                globalRecallAt3: parseFloat((totalR3 / count).toFixed(4)),
                globalPrecisionAt5: parseFloat((totalP5 / count).toFixed(4)),
                globalRecallAt5: parseFloat((totalR5 / count).toFixed(4)),
                globalMRR: parseFloat(globalMRR.toFixed(4)),
                globalRougeLScore: parseFloat((totalRougeL / count).toFixed(4)),
                globalFaithfulness: parseFloat((totalFaithfulness / count).toFixed(4)),
                globalSemanticSimilarityScore: parseFloat((totalSemantic / count).toFixed(4)),
                globalSuccessRate: parseFloat((totalSuccess / count).toFixed(4)),
            },
            ablation: {
                mrrWithReranking: parseFloat(globalMRR.toFixed(4)),
                mrrWithoutReranking: parseFloat(globalMRRNoRerank.toFixed(4)),
                mrrImprovement: parseFloat((globalMRR - globalMRRNoRerank).toFixed(4)),
                precisionAt3WithReranking: parseFloat(globalP3.toFixed(4)),
                precisionAt3WithoutReranking: parseFloat(globalP3NoRerank.toFixed(4)),
                precisionAt3Improvement: parseFloat((globalP3 - globalP3NoRerank).toFixed(4)),
            },
            categoryBreakdown,
            details,
        };
        const outputDir = path.dirname(this.OUTPUT_PATH);
        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(this.OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
        this.logger.log(`Evaluation report saved to ${this.OUTPUT_PATH}`);
        return report;
    }
    async evaluate(input, textForFaithfulness, precomputedExpectedVec) {
        const precisionAt3 = this.calculatePrecisionAtK(input.retrievedDocIds, input.expectedDocIds, 3);
        const recallAt3 = this.calculateRecallAtK(input.retrievedDocIds, input.expectedDocIds, 3);
        const precisionAt5 = this.calculatePrecisionAtK(input.retrievedDocIds, input.expectedDocIds, 5);
        const recallAt5 = this.calculateRecallAtK(input.retrievedDocIds, input.expectedDocIds, 5);
        const mrr = this.calculateMRR(input.retrievedDocIds, input.expectedDocIds);
        const rougeLScore = this.calculateRougeL(input.expectedAnswer, input.generatedAnswer);
        const expectedVec = precomputedExpectedVec ?? await this.embeddingService.embed(input.expectedAnswer);
        const generatedVec = await this.embeddingService.embed(input.generatedAnswer);
        const semanticSimilarityScore = this.calculateCosineSimilarity(expectedVec, generatedVec);
        const faithfulnessText = textForFaithfulness ?? input.generatedAnswer;
        const faithfulnessScore = this.calculateFaithfulness(faithfulnessText, input.retrievedContextText);
        const success = faithfulnessScore >= this.FAITHFULNESS_SUCCESS_THRESHOLD &&
            (rougeLScore >= this.ROUGE_SUCCESS_THRESHOLD || semanticSimilarityScore >= this.SEMANTIC_SUCCESS_THRESHOLD);
        return {
            precisionAt3, recallAt3,
            precisionAt5, recallAt5,
            mrr, rougeLScore,
            faithfulnessScore,
            semanticSimilarityScore,
            success,
        };
    }
    calculateCosineSimilarity(vecA, vecB) {
        if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length)
            return 0.0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0)
            return 0.0;
        return parseFloat((dot / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
    }
    calculatePrecisionAtK(retrieved, expected, k) {
        if (k === 0 || retrieved.length === 0)
            return 0.0;
        const relevant = retrieved.slice(0, k).filter(id => expected.includes(id)).length;
        return parseFloat((relevant / k).toFixed(4));
    }
    calculateRecallAtK(retrieved, expected, k) {
        if (expected.length === 0 || retrieved.length === 0)
            return 0.0;
        const relevant = retrieved.slice(0, k).filter(id => expected.includes(id)).length;
        return parseFloat((relevant / expected.length).toFixed(4));
    }
    calculateMRR(retrieved, expected) {
        for (let i = 0; i < retrieved.length; i++) {
            if (expected.includes(retrieved[i]))
                return parseFloat((1 / (i + 1)).toFixed(4));
        }
        return 0.0;
    }
    calculateRougeL(referenceText, generatedText) {
        const refWords = this.tokenizeAndNormalize(referenceText);
        const genWords = this.tokenizeAndNormalize(generatedText);
        const m = refWords.length;
        const n = genWords.length;
        if (m === 0 || n === 0)
            return 0.0;
        const lcs = this.getLcsLength(refWords, genWords);
        const recall = lcs / m;
        const precision = lcs / n;
        if (recall + precision === 0)
            return 0.0;
        return parseFloat(((2 * recall * precision) / (recall + precision)).toFixed(4));
    }
    calculateFaithfulness(answer, context) {
        const answerWords = this.tokenizeAndNormalize(answer);
        const contextWords = new Set(this.tokenizeAndNormalize(context));
        if (answerWords.length === 0)
            return 0.0;
        const supported = answerWords.filter(w => contextWords.has(w)).length;
        return parseFloat((supported / answerWords.length).toFixed(4));
    }
    getLcsLength(w1, w2) {
        const n = w2.length;
        let prev = Array(n + 1).fill(0);
        let curr = Array(n + 1).fill(0);
        for (let i = 1; i <= w1.length; i++) {
            for (let j = 1; j <= n; j++) {
                curr[j] = w1[i - 1] === w2[j - 1]
                    ? prev[j - 1] + 1
                    : Math.max(prev[j], curr[j - 1]);
            }
            prev = [...curr];
            curr = Array(n + 1).fill(0);
        }
        return prev[n];
    }
    tokenizeAndNormalize(text) {
        return (text ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);
    }
};
exports.EvaluationService = EvaluationService;
exports.EvaluationService = EvaluationService = EvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rag_pipeline_service_1.RagPipelineService,
        embedding_service_1.EmbeddingService])
], EvaluationService);
//# sourceMappingURL=evaluation.service.js.map