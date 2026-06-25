import { ParserService } from './parser.service';
import { AiService } from './ai.service';
import { EvaluationMetricsService } from './evaluation-metrics.service';
export declare class ParserController {
    private readonly parserService;
    private readonly AiService;
    private readonly metricsService;
    constructor(parserService: ParserService, AiService: AiService, metricsService: EvaluationMetricsService);
    extractCertificate(body: any): Promise<{
        status: string;
        data: any;
        message?: undefined;
    } | {
        status: string;
        message: any;
        data?: undefined;
    }>;
    triggerBatchEvaluation(): Promise<{
        success: boolean;
        message: string;
    }>;
}
