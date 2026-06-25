import { CvParserFacade } from '../services/cv-parser.facade';
import { CvEvaluationService } from '../services/cv-evaluation.service';
import { PdfParserService } from '../services/pdf-parser.service';
import { CvHeuristicParserService } from '../services/cv-heuristic-parser.service';
export declare class DocumentController {
    private readonly cvParserFacade;
    private readonly cvEvaluationService;
    private readonly pdfParserService;
    private readonly cvHeuristicParserService;
    private readonly logger;
    constructor(cvParserFacade: CvParserFacade, cvEvaluationService: CvEvaluationService, pdfParserService: PdfParserService, cvHeuristicParserService: CvHeuristicParserService);
    testPdf(file: Express.Multer.File): Promise<{
        cv_id: number;
        user_id: number;
        file_path: string;
        format: string;
        generated: boolean;
        last_updated: Date;
        full_name: string;
        profession: string;
        email: string;
        phone: string;
        fax: string;
        address: string;
        skills: string[];
        certifications: any[];
        education: any[];
        projects: any[];
        experiences: any[];
    }>;
    parseCv(file: Express.Multer.File): Promise<any>;
    runEvaluation(): Promise<{
        status: string;
        message: string;
        timestamp: string;
        report: any;
    }>;
}
