import { CvParsingService } from './cv-parsing.service';
export declare class CvParsingController {
    private readonly CvParsingService;
    constructor(CvParsingService: CvParsingService);
    testPdf(body: {
        filePath: string;
    }): Promise<{
        status: string;
        raw_text: string;
    }>;
    uploadFile(req: any, file: Express.Multer.File): Promise<{
        status: string;
        data: {
            contact: {
                name: string;
                profession: string;
                phone: string;
                fax: string;
                email: string;
                address: string;
            };
            experience: any[];
            certifications: any[];
            education: any[];
            projects: any[];
            skills: any[];
        };
    }>;
}
