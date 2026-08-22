import { ParserService } from './parser.service';
import { LlmService, ExtractedCertificate } from './llm.service';
export declare class AiService {
    private readonly ParserService;
    private readonly llmService;
    constructor(ParserService: ParserService, llmService: LlmService);
    extractCertificate(filePath: string): Promise<ExtractedCertificate>;
    extractCertificate2(filePath: string): Promise<{
        ocrText: string;
        ocrConfidence: number;
        certificate_name?: string;
        provider?: string;
        date_of_obtention?: string | null;
        date_of_expiration?: string | null;
        error?: string;
    }>;
}
