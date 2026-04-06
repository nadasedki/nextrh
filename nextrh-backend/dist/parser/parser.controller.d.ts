import { ParserService } from './parser.service';
import { AiService } from './ai.service';
export declare class ParserController {
    private readonly parserService;
    private readonly AiService;
    constructor(parserService: ParserService, AiService: AiService);
    extractCertificate(body: any): Promise<{
        status: string;
        data: any;
        message?: undefined;
    } | {
        status: string;
        message: any;
        data?: undefined;
    }>;
}
