import { CvService } from './cv.service';
import { CvImportService } from './cv-import/cv-import.service';
export declare class CvController {
    private readonly cvService;
    private readonly cvImportService;
    private readonly logger;
    constructor(cvService: CvService, cvImportService: CvImportService);
    uploadCv(req: any, file: Express.Multer.File): Promise<{
        status: string;
        cvId: number;
        metrics: any;
        data: any;
    }>;
}
