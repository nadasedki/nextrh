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
const cv_parser_facade_1 = require("./cv-parser.facade");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let CvEvaluationService = CvEvaluationService_1 = class CvEvaluationService {
    constructor(cvParserFacade) {
        this.cvParserFacade = cvParserFacade;
        this.logger = new common_1.Logger(CvEvaluationService_1.name);
        this.SIMILARITY_THRESHOLD = 0.80;
    }
    async runAcademicEvaluation() {
        const testDataDir = path.join(process.cwd(), 'test', 'data');
        const groundTruthPath = path.join(testDataDir, 'cv-ground-truth.json');
        if (!fs.existsSync(groundTruthPath)) {
            this.logger.error(`Le fichier ground-truth.json est introuvable à cet endroit : ${groundTruthPath}`);
            throw new Error(`Ground truth database file missing at: ${groundTruthPath}`);
        }
        const dataset = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));
        const metrics = {
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
        for (const testCase of dataset) {
            const samplePath = path.join(testDataDir, testCase.fileName);
            if (!fs.existsSync(samplePath)) {
                this.logger.warn(`Le fichier échantillon ${testCase.fileName} est absent du dossier test/data/. Passage au suivant.`);
                continue;
            }
            try {
                const fileBuffer = fs.readFileSync(samplePath);
                const response = await this.cvParserFacade.parseCv(fileBuffer);
                const parsedProfile = response?.data?.profile || {};
                const parsedExperiences = response?.data?.experience || [];
                const parsedCertifications = response?.data?.certifications || [];
                const parsedEducation = response?.data?.education || [];
                const parsedProjects = response?.data?.projects || [];
                this.computeTextSoftScores(testCase.expected.profile.name, parsedProfile.name, metrics.name);
                this.computeTextSoftScores(testCase.expected.profile.profession, parsedProfile.profession, metrics.profession);
                this.computeTextSoftScores(testCase.expected.profile.phone, parsedProfile.phone, metrics.phone);
                this.computeTextSoftScores(testCase.expected.profile.email, parsedProfile.email, metrics.email);
                this.computeTextSoftScores(testCase.expected.profile.address, parsedProfile.address, metrics.address);
                this.computeArraySoftScores(testCase.expected.profile.skills || [], parsedProfile.skills || [], metrics.skills);
                this.computeObjectArraySoftScores(testCase.expected.experience || [], parsedExperiences, metrics.experience, ['company', 'period', 'role']);
                this.computeObjectArraySoftScores(testCase.expected.certifications || [], parsedCertifications, metrics.certifications, ['certName', 'date']);
                this.computeObjectArraySoftScores(testCase.expected.education || [], parsedEducation, metrics.education, ['institution', 'degree', 'year']);
                this.computeObjectArraySoftScores(testCase.expected.projects || [], parsedProjects, metrics.projects, ['client', 'description', 'year']);
            }
            catch (err) {
                this.logger.error(`Erreur lors du traitement académique de ${testCase.fileName}: ${err.message}`);
            }
        }
        return this.calculateFinalMatrix(metrics);
    }
    computeTextSoftScores(expected, parsed, acc) {
        const expClean = (expected || '').trim();
        const parseClean = (parsed || '').trim();
        if (!expClean && !parseClean)
            return;
        const similarity = this.calculateSimilarity(expClean, parseClean);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
            acc.tp++;
        }
        else {
            if (parseClean !== '')
                acc.fp++;
            if (expClean !== '')
                acc.fn++;
        }
    }
    computeArraySoftScores(expectedList, parsedList, acc) {
        const matchedParsedIndexes = new Set();
        expectedList.forEach(expected => {
            const foundIdx = parsedList.findIndex((parsed, idx) => {
                if (matchedParsedIndexes.has(idx))
                    return false;
                return this.calculateSimilarity(expected, parsed) >= this.SIMILARITY_THRESHOLD;
            });
            if (foundIdx !== -1) {
                acc.tp++;
                matchedParsedIndexes.add(foundIdx);
            }
            else {
                acc.fn++;
            }
        });
        parsedList.forEach((_, idx) => {
            if (!matchedParsedIndexes.has(idx))
                acc.fp++;
        });
    }
    computeObjectArraySoftScores(expectedList, parsedList, acc, fields) {
        const matchedParsedIndexes = new Set();
        expectedList.forEach(expected => {
            let bestMatchIdx = -1;
            let maxObjectSimilarity = 0;
            parsedList.forEach((parsed, idx) => {
                if (matchedParsedIndexes.has(idx))
                    return;
                let totalSimilarity = 0;
                fields.forEach(field => {
                    totalSimilarity += this.calculateSimilarity(expected[field], parsed[field]);
                });
                const avgSimilarity = totalSimilarity / fields.length;
                if (avgSimilarity > maxObjectSimilarity) {
                    maxObjectSimilarity = avgSimilarity;
                    bestMatchIdx = idx;
                }
            });
            if (bestMatchIdx !== -1 && maxObjectSimilarity >= this.SIMILARITY_THRESHOLD) {
                acc.tp++;
                matchedParsedIndexes.add(bestMatchIdx);
            }
            else {
                acc.fn++;
            }
        });
        parsedList.forEach((_, idx) => {
            if (!matchedParsedIndexes.has(idx))
                acc.fp++;
        });
    }
    calculateSimilarity(str1, str2) {
        const s1 = (str1 || '').toLowerCase().trim();
        const s2 = (str2 || '').toLowerCase().trim();
        if (s1 === s2)
            return 1.0;
        if (s1.length === 0 || s2.length === 0)
            return 0.0;
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
        return 1 - distance / maxLength;
    }
    calculateFinalMatrix(metrics) {
        const results = {};
        for (const field in metrics) {
            const { tp, fp, fn } = metrics[field];
            const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
            const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
            const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
            results[field] = {
                precision: parseFloat(precision.toFixed(2)),
                recall: parseFloat(recall.toFixed(2)),
                f1Score: parseFloat(f1.toFixed(2)),
                matrix: { truePositive: tp, falsePositive: fp, falseNegative: fn }
            };
        }
        return results;
    }
};
exports.CvEvaluationService = CvEvaluationService;
exports.CvEvaluationService = CvEvaluationService = CvEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cv_parser_facade_1.CvParserFacade])
], CvEvaluationService);
//# sourceMappingURL=cv-evaluation.service.js.map