import { ConfigService } from '@nestjs/config';
import { CvExtractionOrchestrator } from '../../cv-parser/cv-extraction-orchestrator.service';
import { CvHeuristicextractionService } from '../cv-heuristic-extraction.service';
import { CvMultimodalParserService } from '../../cv-parser/cv-multimodal-parser.service';
import { PdfParserService } from './pdf-parser.service';
interface FieldResult {
    precision: number;
    recall: number;
    f1Score: number;
    matrix: {
        truePositive: number;
        falsePositive: number;
        falseNegative: number;
    };
}
interface CvDetailEntry {
    fileName: string;
    parserMode: 'heuristic' | 'hybrid' | 'vlm';
    fieldScores: Record<string, FieldResult>;
    fallbackTriggered: boolean;
}
export interface EvaluationReport {
    evaluatedAt: string;
    totalCvsEvaluated: number;
    similarityThreshold: number;
    averageProcessingTimesSec: {
        heuristicOnly: number;
        hybrid: number;
        vlm: number;
    };
    fallbackFrequency: {
        count: number;
        percentage: number;
    };
    parserFailureRate: {
        count: number;
        percentage: number;
    };
    macroF1Scores: {
        heuristicOnly: number;
        hybrid: number;
        vlm: number;
    };
    heuristicOnlyMetrics: Record<string, FieldResult>;
    hybridMetrics: Record<string, FieldResult>;
    vlmMetrics: Record<string, FieldResult>;
    details: CvDetailEntry[];
}
export declare class CvEvaluationService {
    private readonly CvExtractionOrchestrator;
    private readonly CvHeuristicextraction;
    private readonly pdfParserService;
    private readonly configService;
    private readonly vlmParser;
    private readonly logger;
    private readonly SIMILARITY_THRESHOLD;
    private readonly GROUND_TRUTH_PATH;
    private readonly OUTPUT_PATH;
    private readonly CACHE_DIR;
    constructor(CvExtractionOrchestrator: CvExtractionOrchestrator, CvHeuristicextraction: CvHeuristicextractionService, pdfParserService: PdfParserService, configService: ConfigService, vlmParser: CvMultimodalParserService);
    runAcademicEvaluation(cacheOnly?: boolean): Promise<EvaluationReport>;
    evaluateCv(fileName: string): Promise<any>;
    private accumulateMetrics;
    private accumulateScalar;
    private accumulateArray;
    private accumulateObjects;
    private computeSingleCvMatrix;
    private buildResultMatrix;
    private levenshteinSimilarity;
    private createEmptyMetricsMap;
}
export {};
