import { AiService } from './ai.service';
export declare class EvaluationMetricsService {
    private readonly aiService;
    private readonly logger;
    constructor(aiService: AiService);
    runEvaluationAndSaveJson(): Promise<void>;
    private normalize;
    private getLevenshteinSimilarity;
    private normalizeOcrText;
}
