import { CvHeuristicParserService } from './cv-heuristic-parser.service';
import { OcrService } from './ocr.service';
export declare class CvParserFacade2 {
    private readonly heuristicParser;
    private readonly ocrService;
    private readonly logger;
    private readonly llmModel;
    private readonly CONFIDENCE_THRESHOLD;
    constructor(heuristicParser: CvHeuristicParserService, ocrService: OcrService);
    parseScannedCv(fileBuffer: Buffer): Promise<any>;
    private calculateExperienceConfidence;
    private runTargetedLlmFallback;
}
