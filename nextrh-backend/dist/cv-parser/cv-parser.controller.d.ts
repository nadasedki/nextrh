import { CvExtractionOrchestrator } from './cv-extraction-orchestrator.service';
import { CvEvaluationService } from './services/cv-evaluation.service';
import { ConfigService } from '@nestjs/config';
import { CvMultimodalParserService } from './cv-multimodal-parser.service';
export declare class CvParserController {
    private readonly cvParserOrchestrator;
    private readonly cvEvaluationService;
    private readonly configService;
    private readonly geminiParser;
    private readonly logger;
    constructor(cvParserOrchestrator: CvExtractionOrchestrator, cvEvaluationService: CvEvaluationService, configService: ConfigService, geminiParser: CvMultimodalParserService);
    parseCv(file: Express.Multer.File): Promise<import("./interfaces/cv-extraction.types").ParsedCvResponse>;
    runEvaluation(cacheOnlyStr?: string): Promise<{
        status: string;
        message: string;
        timestamp: string;
        report: import("./services/cv-evaluation.service").EvaluationReport;
    }>;
    evaluateSingleCv(fileName: string): Promise<any>;
}
