import { CvHeuristicParserService } from './cv-heuristic-parser.service';
import { PdfParserService } from './pdf-parser.service';
export declare class CvParserFacade {
    private readonly heuristicParser;
    private readonly pdfParserService;
    private readonly logger;
    private readonly llmModel;
    constructor(heuristicParser: CvHeuristicParserService, pdfParserService: PdfParserService);
    parseCv(fileBuffer: Buffer): Promise<any>;
    private runTargetedLlmFallback;
}
