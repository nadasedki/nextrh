import { PdfParserService } from './services/pdf-parser.service';
import { TextSegmentationService } from './services/text-segmentation.service';
import { CvHeuristicextractionService } from './cv-heuristic-extraction.service';
import { LlmFallbackService } from './services/llm-fallback.service';
import { CertificationExtractorService } from './services/certification-extractor.service';
import { EducationExtractorService } from './services/education-extractor.service';
import { ProjectExtractorService } from './services/project-extractor.service';
import { ExperienceExtractorService } from './services/experience-extractor.service';
import { ParsedCvResponse } from './interfaces/cv-extraction.types';
export declare class CvExtractionOrchestrator {
    private readonly pdfParser;
    private readonly segmenter;
    private readonly heuristicextraction;
    private readonly llmFallback;
    private readonly certExtractor;
    private readonly eduExtractor;
    private readonly projExtractor;
    private readonly expExtractor;
    private readonly logger;
    constructor(pdfParser: PdfParserService, segmenter: TextSegmentationService, heuristicextraction: CvHeuristicextractionService, llmFallback: LlmFallbackService, certExtractor: CertificationExtractorService, eduExtractor: EducationExtractorService, projExtractor: ProjectExtractorService, expExtractor: ExperienceExtractorService);
    parseCv(fileBuffer: Buffer): Promise<ParsedCvResponse>;
}
