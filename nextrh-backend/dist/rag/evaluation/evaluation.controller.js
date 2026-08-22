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
var EvaluationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationController = void 0;
const common_1 = require("@nestjs/common");
const evaluation_service_1 = require("./evaluation.service");
const rag_pipeline_service_1 = require("../application/rag-pipeline.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let EvaluationController = EvaluationController_1 = class EvaluationController {
    constructor(evaluationService, pipelineService) {
        this.evaluationService = evaluationService;
        this.pipelineService = pipelineService;
        this.logger = new common_1.Logger(EvaluationController_1.name);
        this.INDIVIDUAL_RUNS_PATH = path.join(process.cwd(), 'uploads/rag_individual_runs.json');
        this.GLOBAL_REPORT_PATH = path.join(process.cwd(), 'uploads/rag_metrics_report.json');
    }
    async runSingleEvaluation(testCaseIndex) {
        if (testCaseIndex === undefined || isNaN(testCaseIndex)) {
            throw new common_1.BadRequestException('Please provide a valid testCaseIndex.');
        }
        const testCase = this.evaluationService.getTestCase(testCaseIndex);
        if (!testCase) {
            throw new common_1.BadRequestException(`No test case found at index ${testCaseIndex}. ` +
                `Check test/data/rag_ground_truth.json.`);
        }
        this.logger.log(`[EVAL-SINGLE #${testCaseIndex}] Query: "${testCase.query}"`);
        const state = await this.pipelineService.run(testCase.query);
        const answerOnly = state.structuredAnswer?.answer ?? state.answer ?? '';
        const reasoning = state.structuredAnswer?.reasoning ?? '';
        const explanation = state.structuredAnswer?.explanation ?? '';
        const confidence = state.structuredAnswer?.confidence ?? 0;
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
        const metrics = await this.evaluationService.evaluate({
            query: testCase.query,
            expectedDocIds: testCase.expected_doc_ids,
            retrievedDocIds,
            expectedAnswer: testCase.expected_answer,
            generatedAnswer: answerOnly,
            retrievedContextText,
        }, textForFaithfulness);
        let savedRuns = [];
        if (fs.existsSync(this.INDIVIDUAL_RUNS_PATH)) {
            try {
                savedRuns = JSON.parse(fs.readFileSync(this.INDIVIDUAL_RUNS_PATH, 'utf-8'));
            }
            catch {
                savedRuns = [];
            }
        }
        const newRun = {
            testCaseIndex,
            query: testCase.query,
            category: testCase.category,
            expected_answer: testCase.expected_answer,
            generated_answer: answerOnly,
            reasoning,
            explanation,
            confidence,
            retrieved_doc_ids: retrievedDocIds,
            metrics,
            evaluatedAt: new Date().toISOString(),
        };
        const existingIdx = savedRuns.findIndex(r => r.testCaseIndex === testCaseIndex);
        if (existingIdx > -1) {
            savedRuns[existingIdx] = newRun;
        }
        else {
            savedRuns.push(newRun);
        }
        const dir = path.dirname(this.INDIVIDUAL_RUNS_PATH);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.INDIVIDUAL_RUNS_PATH, JSON.stringify(savedRuns, null, 2), 'utf-8');
        const count = savedRuns.length;
        const sums = savedRuns.reduce((acc, run) => {
            acc.p3 += run.metrics.precisionAt3;
            acc.r3 += run.metrics.recallAt3;
            acc.p5 += run.metrics.precisionAt5;
            acc.r5 += run.metrics.recallAt5;
            acc.mrr += run.metrics.mrr;
            acc.rougeL += run.metrics.rougeLScore;
            acc.faithfulness += run.metrics.faithfulnessScore;
            acc.semantic += run.metrics.semanticSimilarityScore;
            if (run.metrics.success)
                acc.successes++;
            return acc;
        }, { p3: 0, r3: 0, p5: 0, r5: 0, mrr: 0, rougeL: 0, faithfulness: 0, semantic: 0, successes: 0 });
        const globalReport = {
            evaluatedAt: new Date().toISOString(),
            successCriteria: {
                faithfulnessThreshold: this.evaluationService.FAITHFULNESS_SUCCESS_THRESHOLD,
                rougeLThreshold: this.evaluationService.ROUGE_SUCCESS_THRESHOLD,
                semanticThreshold: this.evaluationService.SEMANTIC_SUCCESS_THRESHOLD,
                logic: 'faithfulness >= 0.7 AND (rougeL >= 0.5 OR semantic >= 0.75)',
            },
            summary: {
                totalQueriesEvaluated: count,
                globalPrecisionAt3: parseFloat((sums.p3 / count).toFixed(4)),
                globalRecallAt3: parseFloat((sums.r3 / count).toFixed(4)),
                globalPrecisionAt5: parseFloat((sums.p5 / count).toFixed(4)),
                globalRecallAt5: parseFloat((sums.r5 / count).toFixed(4)),
                globalMRR: parseFloat((sums.mrr / count).toFixed(4)),
                globalRougeLScore: parseFloat((sums.rougeL / count).toFixed(4)),
                globalFaithfulness: parseFloat((sums.faithfulness / count).toFixed(4)),
                globalSemanticSimilarityScore: parseFloat((sums.semantic / count).toFixed(4)),
                globalSuccessRate: parseFloat((sums.successes / count).toFixed(4)),
            },
        };
        fs.writeFileSync(this.GLOBAL_REPORT_PATH, JSON.stringify(globalReport, null, 2), 'utf-8');
        this.logger.log(`[EVAL] Test case #${testCaseIndex} done. Global report updated (${count} runs).`);
        return {
            message: `Test case #${testCaseIndex} evaluated. Global metrics recalculated over ${count} runs.`,
            currentRun: newRun,
            globalSummary: globalReport.summary,
        };
    }
};
exports.EvaluationController = EvaluationController;
__decorate([
    (0, common_1.Post)('run-single'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('testCaseIndex')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EvaluationController.prototype, "runSingleEvaluation", null);
exports.EvaluationController = EvaluationController = EvaluationController_1 = __decorate([
    (0, common_1.Controller)('evaluation'),
    __metadata("design:paramtypes", [evaluation_service_1.EvaluationService,
        rag_pipeline_service_1.RagPipelineService])
], EvaluationController);
//# sourceMappingURL=evaluation.controller.js.map