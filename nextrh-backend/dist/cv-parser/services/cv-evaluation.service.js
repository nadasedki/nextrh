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
var CvEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cv_extraction_orchestrator_service_1 = require("../../cv-parser/cv-extraction-orchestrator.service");
const cv_heuristic_extraction_service_1 = require("../cv-heuristic-extraction.service");
const cv_multimodal_parser_service_1 = require("../../cv-parser/cv-multimodal-parser.service");
const pdf_parser_service_1 = require("./pdf-parser.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const perf_hooks_1 = require("perf_hooks");
const FIELD_WEIGHTS = {
    certName: 0.7,
    date: 0.3,
    company: 0.45,
    role: 0.45,
    period: 0.10,
    institution: 0.50,
    degree: 0.40,
    year: 0.10,
    client: 0.50,
    description: 0.40,
};
let CvEvaluationService = CvEvaluationService_1 = class CvEvaluationService {
    constructor(CvExtractionOrchestrator, CvHeuristicextraction, pdfParserService, configService, vlmParser) {
        this.CvExtractionOrchestrator = CvExtractionOrchestrator;
        this.CvHeuristicextraction = CvHeuristicextraction;
        this.pdfParserService = pdfParserService;
        this.configService = configService;
        this.vlmParser = vlmParser;
        this.logger = new common_1.Logger(CvEvaluationService_1.name);
        this.SIMILARITY_THRESHOLD = this.configService.get('CV_EVAL_SIMILARITY_THRESHOLD', 0.80);
        this.GROUND_TRUTH_PATH = path.join(process.cwd(), this.configService.get('CV_GROUND_TRUTH_PATH', 'test/data/cv-ground-truth2.json'));
        this.OUTPUT_PATH = path.join(process.cwd(), this.configService.get('CV_EVAL_OUTPUT_PATH', 'uploads/cv-evaluation-report.json'));
        this.CACHE_DIR = path.join(process.cwd(), 'uploads/individual-evaluations');
    }
    async runAcademicEvaluation(cacheOnly = false) {
        this.logger.log('Starting 3-Way CV parser academic evaluation suite...');
        if (!fs.existsSync(this.GROUND_TRUTH_PATH)) {
            throw new Error(`Ground truth file not found at: ${this.GROUND_TRUTH_PATH}`);
        }
        const dataset = JSON.parse(fs.readFileSync(this.GROUND_TRUTH_PATH, 'utf-8'));
        if (!fs.existsSync(this.CACHE_DIR)) {
            fs.mkdirSync(this.CACHE_DIR, { recursive: true });
        }
        const heuristicMetrics = this.createEmptyMetricsMap();
        const hybridMetrics = this.createEmptyMetricsMap();
        const vlmMetrics = this.createEmptyMetricsMap();
        const details = [];
        let evaluated = 0;
        let failedCount = 0;
        let totalHeuristicTimeMs = 0;
        let totalHybridTimeMs = 0;
        let totalVlmTimeMs = 0;
        let fallbackCount = 0;
        for (const testCase of dataset) {
            const samplePath = path.join(path.dirname(this.GROUND_TRUTH_PATH), testCase.fileName);
            const safeCacheName = testCase.fileName.replace(/[^a-zA-Z0-9]/g, '_');
            const cacheFilePath = path.join(this.CACHE_DIR, `${safeCacheName}_eval.json`);
            const cacheExists = fs.existsSync(cacheFilePath);
            if (cacheOnly && !cacheExists) {
                this.logger.log(`[SKIP] Skipping uncached file: ${testCase.fileName} due to cacheOnly mode. [1]`);
                continue;
            }
            if (!fs.existsSync(samplePath) && !cacheExists) {
                this.logger.warn(`Sample file missing and not cached: ${testCase.fileName} — skipping`);
                continue;
            }
            try {
                let cvEvaluation;
                if (cacheExists) {
                    this.logger.log(`[CACHE HIT] Loading cached evaluation for: ${testCase.fileName} [1]`);
                    cvEvaluation = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
                    totalHeuristicTimeMs += cvEvaluation.executionTimes.heuristicMs;
                    totalHybridTimeMs += cvEvaluation.executionTimes.hybridMs;
                    totalVlmTimeMs += cvEvaluation.executionTimes.vlmMs;
                    if (cvEvaluation.fallbackTriggered) {
                        fallbackCount++;
                    }
                }
                else {
                    this.logger.log(`[CACHE MISS] Running multi-strategy parsers for: ${testCase.fileName} [1]`);
                    const fileBuffer = fs.readFileSync(samplePath);
                    const tHeuristicStart = perf_hooks_1.performance.now();
                    const rawText = await this.pdfParserService.extractRawText(fileBuffer);
                    const hResult = this.CvHeuristicextraction.parse(rawText, 0, 0, testCase.fileName);
                    const heuristicMs = perf_hooks_1.performance.now() - tHeuristicStart;
                    const heuristicParsed = {
                        name: hResult.full_name || '',
                        profession: hResult.profession || '',
                        phone: hResult.phone || '',
                        email: hResult.email || '',
                        address: hResult.address || '',
                        skills: hResult.skills || [],
                        experience: (hResult.experiences || []).map((e) => ({
                            company: e.company, period: e.period, role: e.role,
                        })),
                        certifications: (hResult.certifications || []).map((c) => ({
                            certName: c.cert_name, date: c.date,
                        })),
                        education: (hResult.education || []).map((e) => ({
                            institution: e.institution, degree: e.degree, year: e.year,
                        })),
                        projects: (hResult.projects || []).map((p) => ({
                            client: p.client, description: p.description, year: p.year,
                        })),
                    };
                    const tHybridStart = perf_hooks_1.performance.now();
                    const hybridResponse = await this.CvExtractionOrchestrator.parseCv(fileBuffer);
                    const hybridMs = perf_hooks_1.performance.now() - tHybridStart;
                    const fallbackTriggered = hybridResponse?.execution_metrics?.fallback_triggered ?? false;
                    if (fallbackTriggered) {
                        fallbackCount++;
                    }
                    const hybridProfile = (hybridResponse?.data?.profile ?? {});
                    const hybridParsed = {
                        name: hybridProfile.name || '',
                        profession: hybridProfile.profession || '',
                        phone: hybridProfile.phone || '',
                        email: hybridProfile.email || '',
                        address: hybridProfile.address || '',
                        skills: hybridProfile.skills || [],
                        experience: hybridResponse?.data?.experience || [],
                        certifications: hybridResponse?.data?.certifications || [],
                        education: hybridResponse?.data?.education || [],
                        projects: hybridResponse?.data?.projects || [],
                    };
                    const tVlmStart = perf_hooks_1.performance.now();
                    const vlmResponse = await this.vlmParser.parseCvPdf(fileBuffer);
                    const vlmMs = perf_hooks_1.performance.now() - tVlmStart;
                    const vlmProfile = (vlmResponse?.data?.profile ?? {});
                    const vlmParsed = {
                        name: vlmProfile.name || '',
                        profession: vlmProfile.profession || '',
                        phone: vlmProfile.phone || '',
                        email: vlmProfile.email || '',
                        address: vlmProfile.address || '',
                        skills: vlmProfile.skills || [],
                        experience: vlmResponse?.data?.experience || [],
                        certifications: vlmResponse?.data?.certifications || [],
                        education: vlmResponse?.data?.education || [],
                        projects: vlmResponse?.data?.projects || [],
                    };
                    cvEvaluation = {
                        fileName: testCase.fileName,
                        executionTimes: {
                            heuristicMs,
                            hybridMs,
                            vlmMs: vlmMs,
                        },
                        fallbackTriggered,
                        parsedData: {
                            heuristic: heuristicParsed,
                            hybrid: hybridParsed,
                            vlm: vlmParsed,
                        },
                    };
                    fs.writeFileSync(cacheFilePath, JSON.stringify(cvEvaluation, null, 2), 'utf-8');
                    totalHeuristicTimeMs += heuristicMs;
                    totalHybridTimeMs += hybridMs;
                    totalVlmTimeMs += vlmMs;
                }
                this.accumulateMetrics(testCase, cvEvaluation.parsedData.heuristic, heuristicMetrics);
                this.accumulateMetrics(testCase, cvEvaluation.parsedData.hybrid, hybridMetrics);
                this.accumulateMetrics(testCase, cvEvaluation.parsedData.vlm, vlmMetrics);
                details.push({
                    fileName: testCase.fileName,
                    parserMode: 'heuristic',
                    fallbackTriggered: false,
                    fieldScores: this.computeSingleCvMatrix(testCase, cvEvaluation.parsedData.heuristic),
                });
                details.push({
                    fileName: testCase.fileName,
                    parserMode: 'hybrid',
                    fallbackTriggered: cvEvaluation.fallbackTriggered,
                    fieldScores: this.computeSingleCvMatrix(testCase, cvEvaluation.parsedData.hybrid),
                });
                details.push({
                    fileName: testCase.fileName,
                    parserMode: 'vlm',
                    fallbackTriggered: false,
                    fieldScores: this.computeSingleCvMatrix(testCase, cvEvaluation.parsedData.vlm),
                });
                evaluated++;
            }
            catch (err) {
                failedCount++;
                this.logger.error(`Evaluation failed for ${testCase.fileName}: ${err.message}`);
            }
        }
        if (evaluated === 0) {
            throw new Error('Evaluation completed with 0 parsed CVs. Please verify your ground-truth configuration and local PDF files.');
        }
        const heuristicResults = this.buildResultMatrix(heuristicMetrics);
        const hybridResults = this.buildResultMatrix(hybridMetrics);
        const vlmResults = this.buildResultMatrix(vlmMetrics);
        const computeMacroF1 = (results) => {
            const validFields = Object.entries(results).filter(([_, metric]) => {
                const total = metric.matrix.truePositive +
                    metric.matrix.falsePositive +
                    metric.matrix.falseNegative;
                return total > 0;
            });
            if (validFields.length === 0)
                return 0;
            const sum = validFields.reduce((acc, [_, metric]) => acc + metric.f1Score, 0);
            return parseFloat((sum / validFields.length).toFixed(4));
        };
        const macroHeuristic = computeMacroF1(heuristicResults);
        const macroHybrid = computeMacroF1(hybridResults);
        const macroVlm = computeMacroF1(vlmResults);
        const report = {
            evaluatedAt: new Date().toISOString(),
            totalCvsEvaluated: evaluated,
            similarityThreshold: this.SIMILARITY_THRESHOLD,
            averageProcessingTimesSec: {
                heuristicOnly: parseFloat(((totalHeuristicTimeMs / evaluated) / 1000).toFixed(3)),
                hybrid: parseFloat(((totalHybridTimeMs / evaluated) / 1000).toFixed(3)),
                vlm: parseFloat(((totalVlmTimeMs / evaluated) / 1000).toFixed(3)),
            },
            fallbackFrequency: {
                count: fallbackCount,
                percentage: parseFloat(((fallbackCount / evaluated) * 100).toFixed(1)),
            },
            parserFailureRate: {
                count: failedCount,
                percentage: parseFloat(((failedCount / (evaluated + failedCount)) * 100).toFixed(1)),
            },
            macroF1Scores: {
                heuristicOnly: macroHeuristic,
                hybrid: macroHybrid,
                vlm: macroVlm,
            },
            heuristicOnlyMetrics: heuristicResults,
            hybridMetrics: hybridResults,
            vlmMetrics: vlmResults,
            details,
        };
        const outputDir = path.dirname(this.OUTPUT_PATH);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(this.OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
        this.logger.log(`Global evaluation report successfully saved to ${this.OUTPUT_PATH}`);
        return report;
    }
    async evaluateCv(fileName) {
        if (!fs.existsSync(this.GROUND_TRUTH_PATH)) {
            throw new Error(`Ground truth file not found at: ${this.GROUND_TRUTH_PATH}`);
        }
        const dataset = JSON.parse(fs.readFileSync(this.GROUND_TRUTH_PATH, 'utf-8'));
        const testCase = dataset.find(tc => tc.fileName === fileName);
        if (!testCase) {
            throw new common_1.NotFoundException(`CV filename "${fileName}" was not found in your ground-truth dataset.`);
        }
        const samplePath = path.join(path.dirname(this.GROUND_TRUTH_PATH), testCase.fileName);
        if (!fs.existsSync(samplePath)) {
            throw new common_1.NotFoundException(`Sample file missing locally: ${testCase.fileName}`);
        }
        if (!fs.existsSync(this.CACHE_DIR)) {
            fs.mkdirSync(this.CACHE_DIR, { recursive: true });
        }
        const safeCacheName = testCase.fileName.replace(/[^a-zA-Z0-9]/g, '_');
        const cacheFilePath = path.join(this.CACHE_DIR, `${safeCacheName}_eval.json`);
        let cvEvaluation;
        if (fs.existsSync(cacheFilePath)) {
            this.logger.log(`[CACHE HIT] Loading cached evaluation for: ${testCase.fileName} [1]`);
            cvEvaluation = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
        }
        else {
            this.logger.log(`[CACHE MISS] Running visual & rule parsers for: ${testCase.fileName} [1]`);
            const fileBuffer = fs.readFileSync(samplePath);
            const tHeuristicStart = perf_hooks_1.performance.now();
            const rawText = await this.pdfParserService.extractRawText(fileBuffer);
            const hResult = this.CvHeuristicextraction.parse(rawText, 0, 0, testCase.fileName);
            const heuristicMs = perf_hooks_1.performance.now() - tHeuristicStart;
            const heuristicParsed = {
                name: hResult.full_name || '',
                profession: hResult.profession || '',
                phone: hResult.phone || '',
                email: hResult.email || '',
                address: hResult.address || '',
                skills: hResult.skills || [],
                experience: (hResult.experiences || []).map((e) => ({
                    company: e.company, period: e.period, role: e.role,
                })),
                certifications: (hResult.certifications || []).map((c) => ({
                    certName: c.cert_name, date: c.date,
                })),
                education: (hResult.education || []).map((e) => ({
                    institution: e.institution, degree: e.degree, year: e.year,
                })),
                projects: (hResult.projects || []).map((p) => ({
                    client: p.client, description: p.description, year: p.year,
                })),
            };
            const tHybridStart = perf_hooks_1.performance.now();
            const hybridResponse = await this.CvExtractionOrchestrator.parseCv(fileBuffer);
            const hybridMs = perf_hooks_1.performance.now() - tHybridStart;
            const fallbackTriggered = hybridResponse?.execution_metrics?.fallback_triggered ?? false;
            const hybridProfile = (hybridResponse?.data?.profile ?? {});
            const hybridParsed = {
                name: hybridProfile.name || '',
                profession: hybridProfile.profession || '',
                phone: hybridProfile.phone || '',
                email: hybridProfile.email || '',
                address: hybridProfile.address || '',
                skills: hybridProfile.skills || [],
                experience: hybridResponse?.data?.experience || [],
                certifications: hybridResponse?.data?.certifications || [],
                education: hybridResponse?.data?.education || [],
                projects: hybridResponse?.data?.projects || [],
            };
            const tVlmStart = perf_hooks_1.performance.now();
            const vlmResponse = await this.vlmParser.parseCvPdf(fileBuffer);
            const vlmMs = perf_hooks_1.performance.now() - tVlmStart;
            const vlmProfile = (vlmResponse?.data?.profile ?? {});
            const vlmParsed = {
                name: vlmProfile.name || '',
                profession: vlmProfile.profession || '',
                phone: vlmProfile.phone || '',
                email: vlmProfile.email || '',
                address: vlmProfile.address || '',
                skills: vlmProfile.skills || [],
                experience: vlmResponse?.data?.experience || [],
                certifications: vlmResponse?.data?.certifications || [],
                education: vlmResponse?.data?.education || [],
                projects: vlmResponse?.data?.projects || [],
            };
            cvEvaluation = {
                fileName: testCase.fileName,
                executionTimes: {
                    heuristicMs,
                    hybridMs,
                    vlmMs: vlmMs,
                },
                fallbackTriggered,
                parsedData: {
                    heuristic: heuristicParsed,
                    hybrid: hybridParsed,
                    vlm: vlmParsed,
                },
            };
            fs.writeFileSync(cacheFilePath, JSON.stringify(cvEvaluation, null, 2), 'utf-8');
        }
        const heuristicScores = this.computeSingleCvMatrix(testCase, cvEvaluation.parsedData.heuristic);
        const hybridScores = this.computeSingleCvMatrix(testCase, cvEvaluation.parsedData.hybrid);
        const vlmScores = this.computeSingleCvMatrix(testCase, cvEvaluation.parsedData.vlm);
        return {
            status: 'success',
            evaluatedAt: new Date().toISOString(),
            fileName: testCase.fileName,
            fallbackTriggered: cvEvaluation.fallbackTriggered,
            executionTimesSec: {
                heuristicOnly: parseFloat((cvEvaluation.executionTimes.heuristicMs / 1000).toFixed(3)),
                hybrid: parseFloat((cvEvaluation.executionTimes.hybridMs / 1000).toFixed(3)),
                vlm: parseFloat((cvEvaluation.executionTimes.vlmMs / 1000).toFixed(3)),
            },
            scores: {
                heuristicOnly: heuristicScores,
                hybrid: hybridScores,
                vlm: vlmScores,
            },
        };
    }
    accumulateMetrics(testCase, parsed, metrics) {
        this.accumulateScalar(testCase.expected.profile.name, parsed.name, metrics.name);
        this.accumulateScalar(testCase.expected.profile.profession, parsed.profession, metrics.profession);
        this.accumulateScalar(testCase.expected.profile.phone, parsed.phone, metrics.phone);
        this.accumulateScalar(testCase.expected.profile.email, parsed.email, metrics.email);
        this.accumulateScalar(testCase.expected.profile.address, parsed.address, metrics.address);
        this.accumulateArray(testCase.expected.profile.skills || [], parsed.skills, metrics.skills);
        this.accumulateObjects(testCase.expected.experience || [], parsed.experience, metrics.experience, ['company', 'period', 'role']);
        this.accumulateObjects(testCase.expected.certifications || [], parsed.certifications, metrics.certifications, ['certName', 'date']);
        this.accumulateObjects(testCase.expected.education || [], parsed.education, metrics.education, ['institution', 'degree', 'year']);
        this.accumulateObjects(testCase.expected.projects || [], parsed.projects, metrics.projects, ['client', 'description', 'year']);
    }
    accumulateScalar(expected, parsed, acc) {
        const exp = (expected || '').trim();
        const par = (parsed || '').trim();
        if (!exp && !par)
            return;
        const similarity = this.levenshteinSimilarity(exp, par);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
            acc.tp++;
        }
        else {
            if (par)
                acc.fp++;
            if (exp)
                acc.fn++;
        }
    }
    accumulateArray(expectedList, parsedList, acc) {
        const claimed = new Set();
        for (const expected of expectedList) {
            const matchIdx = parsedList.findIndex((parsed, idx) => {
                if (claimed.has(idx))
                    return false;
                return this.levenshteinSimilarity(expected, parsed) >= this.SIMILARITY_THRESHOLD;
            });
            if (matchIdx !== -1) {
                acc.tp++;
                claimed.add(matchIdx);
            }
            else {
                acc.fn++;
            }
        }
        parsedList.forEach((_, idx) => {
            if (!claimed.has(idx))
                acc.fp++;
        });
    }
    accumulateObjects(expectedList, parsedList, acc, fields) {
        const claimed = new Set();
        for (const expected of expectedList) {
            let bestIdx = -1;
            let bestScore = 0;
            parsedList.forEach((parsed, idx) => {
                if (claimed.has(idx))
                    return;
                let weightedSum = 0;
                let totalWeight = 0;
                for (const field of fields) {
                    const weight = FIELD_WEIGHTS[field] ?? 1.0;
                    const sim = this.levenshteinSimilarity(String(expected[field] ?? ''), String(parsed[field] ?? ''));
                    weightedSum += sim * weight;
                    totalWeight += weight;
                }
                const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
                if (score > bestScore) {
                    bestScore = score;
                    bestIdx = idx;
                }
            });
            if (bestIdx !== -1 && bestScore >= this.SIMILARITY_THRESHOLD) {
                acc.tp++;
                claimed.add(bestIdx);
            }
            else {
                acc.fn++;
            }
        }
        parsedList.forEach((_, idx) => {
            if (!claimed.has(idx))
                acc.fp++;
        });
    }
    computeSingleCvMatrix(testCase, parsed) {
        const m = this.createEmptyMetricsMap();
        this.accumulateMetrics(testCase, parsed, m);
        return this.buildResultMatrix(m);
    }
    buildResultMatrix(metrics) {
        const results = {};
        for (const field in metrics) {
            const { tp, fp, fn } = metrics[field];
            const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
            const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
            const f1 = precision + recall === 0
                ? 0
                : (2 * precision * recall) / (precision + recall);
            results[field] = {
                precision: parseFloat(precision.toFixed(4)),
                recall: parseFloat(recall.toFixed(4)),
                f1Score: parseFloat(f1.toFixed(4)),
                matrix: {
                    truePositive: tp,
                    falsePositive: fp,
                    falseNegative: fn,
                },
            };
        }
        return results;
    }
    levenshteinSimilarity(str1, str2) {
        const s1 = (str1 || '').toLowerCase().trim();
        const s2 = (str2 || '').toLowerCase().trim();
        if (s1 === s2)
            return 1.0;
        if (s1.length === 0 || s2.length === 0)
            return 0.0;
        let prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
        let currRow = Array(s2.length + 1).fill(0);
        for (let i = 1; i <= s1.length; i++) {
            currRow[0] = i;
            for (let j = 1; j <= s2.length; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                currRow[j] = Math.min(prevRow[j] + 1, currRow[j - 1] + 1, prevRow[j - 1] + cost);
            }
            prevRow = [...currRow];
        }
        const distance = prevRow[s2.length];
        const maxLength = Math.max(s1.length, s2.length);
        return 1 - distance / maxLength;
    }
    createEmptyMetricsMap() {
        return {
            name: { tp: 0, fp: 0, fn: 0 },
            profession: { tp: 0, fp: 0, fn: 0 },
            phone: { tp: 0, fp: 0, fn: 0 },
            email: { tp: 0, fp: 0, fn: 0 },
            address: { tp: 0, fp: 0, fn: 0 },
            skills: { tp: 0, fp: 0, fn: 0 },
            experience: { tp: 0, fp: 0, fn: 0 },
            certifications: { tp: 0, fp: 0, fn: 0 },
            education: { tp: 0, fp: 0, fn: 0 },
            projects: { tp: 0, fp: 0, fn: 0 },
        };
    }
};
exports.CvEvaluationService = CvEvaluationService;
exports.CvEvaluationService = CvEvaluationService = CvEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_extraction_orchestrator_service_1.CvExtractionOrchestrator,
        cv_heuristic_extraction_service_1.CvHeuristicextractionService,
        pdf_parser_service_1.PdfParserService,
        config_1.ConfigService,
        cv_multimodal_parser_service_1.CvMultimodalParserService])
], CvEvaluationService);
//# sourceMappingURL=cv-evaluation.service.js.map