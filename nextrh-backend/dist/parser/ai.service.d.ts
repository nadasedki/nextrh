import { ParserService } from './parser.service';
import { LlmService } from './llm.service';
export declare class AiService {
    private readonly ParserService;
    private readonly llmService;
    constructor(ParserService: ParserService, llmService: LlmService);
    extractCertificate(filePath: string): Promise<any>;
}
