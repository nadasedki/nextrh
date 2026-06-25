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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let EvaluationService = EvaluationService_1 = class EvaluationService {
    constructor(pipeline) {
        this.pipeline = pipeline;
        this.logger = new common_1.Logger(EvaluationService_1.name);
        this.ROUGE_SUCCESS_THRESHOLD = 0.5;
        this.FAITHFULNESS_SUCCESS_THRESHOLD = 0.7;
    }
    async runEvaluationSuite() {
        this.logger.log('🚀 Initiating automated RAG metrics evaluation suite...');
        const groundTruthPath = path.join(process.cwd(), 'test/data/rag_ground_truth.json');
        const outputPath = path.join(process.cwd(), 'uploads/rag_metrics_report.json');
        if (!fs.existsSync(groundTruthPath)) {
            throw new Error(`RAG ground truth file not found at ${groundTruthPath}`);
        }
        const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf-8'));
        const detailsLog = [];
        let totalPrecision = 0;
        let totalRecall = 0;
        let totalMRR = 0;
        let totalRougeL = 0;
        let totalSuccessCount = 0;
        const cases = groundTruth.test_cases;
        for (const testCase of cases) {
            this.logger.log(`Evaluating RAG query: "${testCase.query}"...`);
            try {
                const pipelineResult = await this.pipeline.run(testCase.query);
                const retrievedDocIds = pipelineResult.sources.map(s => String(s.cv_id || s.id || ''));
                const retrievedContextText = pipelineResult.sources.map(s => String(s.text || s.content || '')).join('\n');
                const evalInput = {
                    query: testCase.query,
                    expectedDocIds: testCase.expected_doc_ids,
                    retrievedDocIds,
                    expectedAnswer: testCase.expected_answer,
                    generatedAnswer: pipelineResult.answer,
                    retrievedContextText,
                };
                const metrics = this.evaluate(evalInput);
                totalPrecision += metrics.precisionAtK;
                totalRecall += metrics.recallAtK;
                totalMRR += metrics.mrr;
                totalRougeL += metrics.rougeLScore;
                if (metrics.success)
                    totalSuccessCount++;
                detailsLog.push({
                    query: testCase.query,
                    metrics,
                    generated_answer: pipelineResult.answer,
                    expected_answer: testCase.expected_answer,
                    retrieved_sources_ids: retrievedDocIds,
                });
            }
            catch (error) {
                this.logger.error(`Failed to evaluate query "${testCase.query}": ${error.message}`);
            }
        }
        const testCasesCount = cases.length;
        const globalPrecision = testCasesCount > 0 ? totalPrecision / testCasesCount : 0;
        const globalRecall = testCasesCount > 0 ? totalRecall / testCasesCount : 0;
        const globalMRR = testCasesCount > 0 ? totalMRR / testCasesCount : 0;
        const globalRougeL = testCasesCount > 0 ? totalRougeL / testCasesCount : 0;
        const successRate = testCasesCount > 0 ? totalSuccessCount / testCasesCount : 0;
        const report = {
            evaluatedAt: new Date().toISOString(),
            summary: {
                totalQueriesEvaluated: testCasesCount,
                globalPrecisionAtK: parseFloat(globalPrecision.toFixed(4)),
                globalRecallAtK: parseFloat(globalRecall.toFixed(4)),
                globalMRR: parseFloat(globalMRR.toFixed(4)),
                globalRougeLScore: parseFloat(globalRougeL.toFixed(4)),
                globalSuccessRate: parseFloat(successRate.toFixed(4)),
            },
            details: detailsLog,
        };
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
        this.logger.log(`RAG evaluation report saved successfully to ${outputPath}`);
        return report;
    }
    evaluate(input, k = 3) {
        const precisionAtK = this.calculatePrecisionAtK(input.retrievedDocIds, input.expectedDocIds, k);
        const recallAtK = this.calculateRecallAtK(input.retrievedDocIds, input.expectedDocIds, k);
        const mrr = this.calculateMRR(input.retrievedDocIds, input.expectedDocIds);
        const rougeLScore = this.calculateRougeL(input.expectedAnswer, input.generatedAnswer);
        const faithfulnessScore = this.calculateFaithfulness(input.generatedAnswer, input.retrievedContextText);
        const success = faithfulnessScore >= this.FAITHFULNESS_SUCCESS_THRESHOLD &&
            rougeLScore >= this.ROUGE_SUCCESS_THRESHOLD;
        return {
            precisionAtK,
            recallAtK,
            mrr,
            rougeLScore,
            faithfulnessScore,
            success,
        };
    }
    calculatePrecisionAtK(retrieved, expected, k) {
        if (k === 0 || retrieved.length === 0)
            return 0.0;
        const topKRetrieved = retrieved.slice(0, k);
        const relevantCount = topKRetrieved.filter(id => expected.includes(id)).length;
        return parseFloat((relevantCount / k).toFixed(4));
    }
    calculateRecallAtK(retrieved, expected, k) {
        if (expected.length === 0 || retrieved.length === 0)
            return 0.0;
        const topKRetrieved = retrieved.slice(0, k);
        const relevantCount = topKRetrieved.filter(id => expected.includes(id)).length;
        return parseFloat((relevantCount / expected.length).toFixed(4));
    }
    calculateMRR(retrieved, expected) {
        for (let i = 0; i < retrieved.length; i++) {
            if (expected.includes(retrieved[i])) {
                return parseFloat((1 / (i + 1)).toFixed(4));
            }
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
        const lcsLength = this.getLcsLength(refWords, genWords);
        const recall = lcsLength / m;
        const precision = lcsLength / n;
        if (recall + precision === 0)
            return 0.0;
        const f1 = (2 * recall * precision) / (recall + precision);
        return parseFloat(f1.toFixed(4));
    }
    calculateFaithfulness(answer, context) {
        const answerWords = this.tokenizeAndNormalize(answer);
        const contextWords = new Set(this.tokenizeAndNormalize(context));
        if (answerWords.length === 0)
            return 0.0;
        let supportedWordsCount = 0;
        for (const word of answerWords) {
            if (contextWords.has(word)) {
                supportedWordsCount++;
            }
        }
        return parseFloat((supportedWordsCount / answerWords.length).toFixed(4));
    }
    getLcsLength(words1, words2) {
        const m = words1.length;
        const n = words2.length;
        let prevRow = Array(n + 1).fill(0);
        let currRow = Array(n + 1).fill(0);
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (words1[i - 1] === words2[j - 1]) {
                    currRow[j] = prevRow[j - 1] + 1;
                }
                else {
                    currRow[j] = Math.max(prevRow[j], currRow[j - 1]);
                }
            }
            prevRow = [...currRow];
        }
        return currRow[n];
    }
    tokenizeAndNormalize(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }
};
exports.EvaluationService = EvaluationService;
exports.EvaluationService = EvaluationService = EvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rag_pipeline_service_1.RagPipelineService])
], EvaluationService);
//# sourceMappingURL=evaluation.service.js.map