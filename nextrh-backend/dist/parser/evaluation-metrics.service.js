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
var EvaluationMetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationMetricsService = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let EvaluationMetricsService = EvaluationMetricsService_1 = class EvaluationMetricsService {
    constructor(aiService) {
        this.aiService = aiService;
        this.logger = new common_1.Logger(EvaluationMetricsService_1.name);
    }
    async runEvaluationAndSaveJson() {
        const groundTruthPath = path.join(process.cwd(), 'test/data/ground_truth.json');
        const outputPath = path.join(process.cwd(), 'uploads/metrics_report.json');
        if (!fs.existsSync(groundTruthPath)) {
            throw new Error(`Ground truth file not found at ${groundTruthPath}`);
        }
        const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf-8'));
        let totalTP = 0;
        let totalFP = 0;
        let totalFN = 0;
        let totalEvaluatedFields = 0;
        let exactMatchFiles = 0;
        let totalOcrAccuracyScore = 0;
        let filesWithOcrCount = 0;
        let totalTesseractConfidenceScore = 0;
        let filesWithConfidenceCount = 0;
        const detailsLog = [];
        for (const [filePath, expected] of Object.entries(groundTruth)) {
            this.logger.log(`Evaluating file: ${filePath}...`);
            let parsed = {};
            let ocrTextExtracted = '';
            let ocrAccuracy = null;
            let tesseractConfidence = null;
            try {
                const aiResponse = await this.aiService.extractCertificate2(filePath);
                if (aiResponse) {
                    ocrTextExtracted = aiResponse.ocrText || '';
                    tesseractConfidence = aiResponse.ocrConfidence || 0;
                    if (tesseractConfidence !== null) {
                        totalTesseractConfidenceScore += tesseractConfidence;
                        filesWithConfidenceCount++;
                    }
                    if (expected.rawText) {
                        ocrAccuracy = this.getLevenshteinSimilarity(ocrTextExtracted, expected.rawText);
                        totalOcrAccuracyScore += ocrAccuracy;
                        filesWithOcrCount++;
                    }
                    parsed = {
                        certName: aiResponse.certificate_name || '',
                        provider: aiResponse.provider || '',
                        issueDate: aiResponse.date_of_obtention || '',
                        expiryDate: aiResponse.date_of_expiration || '',
                    };
                }
            }
            catch (error) {
                this.logger.error(`Failed to parse ${filePath}: ${error.message}`);
            }
            const fieldsToEvaluate = [
                'certName',
                'provider',
                'issueDate',
                'expiryDate',
            ];
            const fileMetrics = {
                tp: 0,
                fp: 0,
                fn: 0,
            };
            let filePerfect = true;
            for (const field of fieldsToEvaluate) {
                const parsedValue = this.normalize(String(parsed[field] ?? ''));
                const expectedValue = this.normalize(String(expected[field] ?? ''));
                const expectedExists = expectedValue.length > 0;
                const parsedExists = parsedValue.length > 0;
                if (!expectedExists && !parsedExists) {
                    continue;
                }
                totalEvaluatedFields++;
                if (expectedExists &&
                    parsedExists &&
                    parsedValue === expectedValue) {
                    fileMetrics.tp++;
                    totalTP++;
                    continue;
                }
                filePerfect = false;
                if (expectedExists && !parsedExists) {
                    fileMetrics.fn++;
                    totalFN++;
                    continue;
                }
                if (!expectedExists && parsedExists) {
                    fileMetrics.fp++;
                    totalFP++;
                    continue;
                }
                if (expectedExists &&
                    parsedExists &&
                    parsedValue !== expectedValue) {
                    fileMetrics.fp++;
                    fileMetrics.fn++;
                    totalFP++;
                    totalFN++;
                }
            }
            if (filePerfect) {
                exactMatchFiles++;
            }
            detailsLog.push({
                file: filePath,
                ocrAccuracy,
                tesseractConfidence,
                extracted: parsed,
                expected,
                metricsForFile: fileMetrics,
            });
        }
        const precision = totalTP + totalFP > 0
            ? totalTP / (totalTP + totalFP)
            : 0;
        const recall = totalTP + totalFN > 0
            ? totalTP / (totalTP + totalFN)
            : 0;
        const f1Score = precision + recall > 0
            ? (2 * precision * recall) / (precision + recall)
            : 0;
        const globalOcrAccuracy = filesWithOcrCount > 0
            ? totalOcrAccuracyScore / filesWithOcrCount
            : 0;
        const globalTesseractConfidence = filesWithConfidenceCount > 0
            ? totalTesseractConfidenceScore / filesWithConfidenceCount : 0;
        const exactMatchAccuracy = Object.keys(groundTruth).length > 0
            ? exactMatchFiles / Object.keys(groundTruth).length
            : 0;
        const report = {
            evaluatedAt: new Date().toISOString(),
            summary: {
                totalFilesEvaluated: Object.keys(groundTruth).length,
                totalFieldsEvaluated: totalEvaluatedFields,
                globalPrecision: Number(precision.toFixed(4)),
                globalRecall: Number(recall.toFixed(4)),
                globalF1Score: Number(f1Score.toFixed(4)),
                exactMatchAccuracy: Number(exactMatchAccuracy.toFixed(4)),
                globalOcrAccuracy: Number(globalOcrAccuracy.toFixed(4)),
                globalTesseractConfidence: Number((globalTesseractConfidence / 100).toFixed(4)),
                totalTruePositives: totalTP,
                totalFalsePositives: totalFP,
                totalFalseNegatives: totalFN,
            },
            details: detailsLog,
        };
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
        this.logger.log(`Detailed metrics report saved successfully to ${outputPath}`);
    }
    normalize(text) {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "")
            .trim();
    }
    getLevenshteinSimilarity(str1, str2) {
        const s1 = this.normalizeOcrText(str1);
        const s2 = this.normalizeOcrText(str2);
        if (s1 === s2)
            return 1.0;
        if (s1.length === 0 || s2.length === 0)
            return 0.0;
        let prevRow = Array(s1.length + 1).fill(0).map((_, i) => i);
        let currRow = Array(s1.length + 1).fill(0);
        for (let j = 1; j <= s2.length; j++) {
            currRow[0] = j;
            for (let i = 1; i <= s1.length; i++) {
                const match = s1[i - 1] === s2[j - 1] ? 0 : 1;
                currRow[i] = Math.min(prevRow[i] + 1, currRow[i - 1] + 1, prevRow[i - 1] + match);
            }
            prevRow = [...currRow];
        }
        const distance = currRow[s1.length];
        const maxLength = Math.max(s1.length, s2.length);
        return parseFloat(((maxLength - distance) / maxLength).toFixed(4));
    }
    normalizeOcrText(text) {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9 ]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }
};
exports.EvaluationMetricsService = EvaluationMetricsService;
exports.EvaluationMetricsService = EvaluationMetricsService = EvaluationMetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], EvaluationMetricsService);
//# sourceMappingURL=evaluation-metrics.service.js.map