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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const common_1 = require("@nestjs/common");
const parser_service_1 = require("../../parser/parser.service");
const llm_service_1 = require("../../parser/llm.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let EvaluationService = class EvaluationService {
    constructor(parserService, llmService) {
        this.parserService = parserService;
        this.llmService = llmService;
    }
    calculateSimilarity(str1, str2) {
        const s1 = String(str1).trim().toLowerCase();
        const s2 = String(str2).trim().toLowerCase();
        if (s1 === s2)
            return 100;
        if (s1.length === 0 || s2.length === 0)
            return 0;
        const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
        for (let i = 0; i <= s1.length; i += 1)
            track[0][i] = i;
        for (let j = 0; j <= s2.length; j += 1)
            track[j][0] = j;
        for (let j = 1; j <= s2.length; j += 1) {
            for (let i = 1; i <= s1.length; i += 1) {
                const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
            }
        }
        const distance = track[s2.length][s1.length];
        const maxLength = Math.max(s1.length, s2.length);
        return ((maxLength - distance) / maxLength) * 100;
    }
    async runTargetedEvaluation(targetType) {
        const groundTruthPath = path.resolve('src/modules/evaluation/data/ground-truth.json');
        if (!fs.existsSync(groundTruthPath)) {
            console.error(`❌ Ground truth file missing at: ${groundTruthPath}`);
            return;
        }
        const rawData = fs.readFileSync(groundTruthPath, 'utf8');
        const allDatasets = JSON.parse(rawData);
        const datasets = allDatasets.filter((item) => item.type === targetType);
        if (datasets.length === 0) {
            console.warn(`⚠️ No test cases found matching type: "${targetType}"`);
            return;
        }
        let totalFiles = datasets.length;
        let totalOcrSuccesses = 0;
        let totalLlmJsonPasses = 0;
        let globalAccuracySum = 0;
        let globalDuration = 0;
        console.log('\n🧪 =======================================================');
        console.log(`🚀 STARTING EVALUATION BENCHMARK: [ ${targetType.toUpperCase()} ]`);
        console.log('=======================================================\n');
        for (const item of datasets) {
            const fileName = path.basename(item.filePath);
            console.log(`-------------------------------------------------------`);
            console.log(`📄 Analyzing Document: ${fileName}`);
            console.log(`-------------------------------------------------------`);
            const startTime = Date.now();
            let isOcrSuccessful = false;
            let isLlmStructuralSuccess = false;
            let fileFieldsChecked = 0;
            let fileAccuracySum = 0;
            let extractedText = '';
            try {
                extractedText = await this.parserService.extractTextFromPdf(item.filePath);
                if (extractedText.toLowerCase().includes(item.expectedOcrSnippet.toLowerCase())) {
                    isOcrSuccessful = true;
                    totalOcrSuccesses++;
                }
            }
            catch (ocrError) {
                console.error(`  ❌ [OCR Crash]: ${ocrError.message}`);
                continue;
            }
            const llmOutput = await this.llmService.extractCertificate(extractedText);
            const endTime = Date.now();
            const executionTime = (endTime - startTime) / 1000;
            globalDuration += (endTime - startTime);
            if (!llmOutput || llmOutput.error) {
                console.error(`  ❌ [LLM Structure Failure]: Invalid JSON compiled schema output.`);
            }
            else {
                isLlmStructuralSuccess = true;
                totalLlmJsonPasses++;
            }
            const expected = item.expectedJson;
            const targetKeys = ['certificate_name', 'certificate_holder', 'provider', 'date_of_obtention', 'date_of_expiration'];
            console.log(`\n  🔎 [Field Comparison Matrix]:`);
            targetKeys.forEach((key) => {
                fileFieldsChecked++;
                const actualValue = llmOutput ? llmOutput[key] : undefined;
                const expectedValue = expected[key];
                let fieldScore = 0;
                if (actualValue === null && expectedValue === null) {
                    fieldScore = 100;
                }
                else if (actualValue && expectedValue) {
                    fieldScore = this.calculateSimilarity(String(actualValue), String(expectedValue));
                }
                else if (!actualValue && !expectedValue) {
                    fieldScore = 100;
                }
                fileAccuracySum += fieldScore;
                console.log(`   • ${key.padEnd(20)} -> Match Quality: ${fieldScore.toFixed(1)}% | Expected: "${expectedValue}" <=> Got: "${actualValue}"`);
            });
            const fileFieldAccuracy = fileFieldsChecked > 0 ? (fileAccuracySum / fileFieldsChecked) : 0;
            globalAccuracySum += fileFieldAccuracy;
            console.log(`\n  📊 [File Performance Card]:`);
            console.log(`   ⏱️  Latency           : ${executionTime.toFixed(2)} seconds`);
            console.log(`   👁️  OCR Anchoring     : ${isOcrSuccessful ? '🟢 PASSED' : '❌ FAILED'}`);
            console.log(`   🤖 LLM Structure     : ${isLlmStructuralSuccess ? '🟢 VALID' : '❌ CORRUPTED'}`);
            console.log(`   🎯 Text Fidelity Acc : ${fileFieldAccuracy.toFixed(1)}%\n`);
        }
        const avgGlobalTime = (globalDuration / totalFiles) / 1000;
        const finalOcrRate = (totalOcrSuccesses / totalFiles) * 100;
        const finalJsonRate = (totalLlmJsonPasses / totalFiles) * 100;
        const finalGlobalAccuracy = (globalAccuracySum / totalFiles);
        console.log('\n=======================================================');
        console.log(`📊 FINAL GLOBAL ACADEMIC SYSTEM PERFORMANCE REPORT (${targetType.toUpperCase()})`);
        console.log('=======================================================');
        console.log(`📂 Total Evaluated Files     : ${totalFiles}`);
        console.log(`⏱️  System Average Latency   : ${avgGlobalTime.toFixed(2)} seconds`);
        console.log(`👁️  OCR Token Anchor Precision: ${finalOcrRate.toFixed(1)}%`);
        console.log(`🤖 Global Schema Reliability : ${finalJsonRate.toFixed(1)}%`);
        console.log(`🎯 Overall Field Text Fidelity: ${finalGlobalAccuracy.toFixed(1)}%`);
        console.log('=======================================================\n');
    }
};
exports.EvaluationService = EvaluationService;
exports.EvaluationService = EvaluationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [parser_service_1.ParserService,
        llm_service_1.LlmService])
], EvaluationService);
//# sourceMappingURL=evaluationcertifpares.js.map