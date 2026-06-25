import { OcrService } from '../services/ocr.service';
import { CvHeuristicParserService } from '../services/cv-heuristic-parser.service';
import { CvParserFacade2 } from '../services/cv-parser.facade2';
export declare class OcrController {
    private readonly ocrService;
    private readonly heuristicParser;
    private readonly cvParserFacade;
    private readonly logger;
    constructor(ocrService: OcrService, heuristicParser: CvHeuristicParserService, cvParserFacade: CvParserFacade2);
    extractTextFromPdf(file: Express.Multer.File): Promise<{
        status: string;
        metadata: {
            filename: string;
            mimetype: string;
            size_bytes: number;
            execution_time_ms: number;
            character_count: number;
        };
        extracted_text: string;
    }>;
    parseScannedPdf2(file: Express.Multer.File): Promise<{
        status: string;
        execution_metrics: {
            total_time_ms: number;
            ocr_extraction_time_ms: number;
            heuristic_parsing_time_ms: number;
            character_count: number;
        };
        data: {
            contact: {
                name: string;
                profession: string;
                phone: string;
                fax: string;
                email: string;
                address: string;
                skills: string[];
            };
            experience: {
                period: any;
                company: any;
                role: any;
            }[];
            certifications: {
                certName: any;
                date: any;
            }[];
            education: {
                year: any;
                institution: any;
                degree: any;
            }[];
            projects: {
                year: any;
                client: any;
                description: any;
            }[];
        };
    }>;
    parseScannedPdf(file: Express.Multer.File): Promise<any>;
}
