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
        metrics: {
            total_time_ms: number;
            heuristic_time_ms: number;
            llm_inference_ms: number;
            fallback_triggered: boolean;
            character_count: number;
        };
        data: {
            profile: {
                name: string;
                profession: string;
                phone: string;
                fax: string;
                email: string;
                address: string;
                skills: string[];
            };
            experience: Array<{
                period: string;
                company: string;
                role: string;
                lowConfidence?: boolean;
            }>;
            certifications: Array<{
                certName: string;
                date: string | null;
                lowConfidence?: boolean;
            }>;
            education: Array<{
                year: string;
                institution: string;
                degree: string;
                lowConfidence?: boolean;
            }>;
            projects: Array<{
                year: string | null;
                client: string;
                description: string;
                lowConfidence?: boolean;
            }>;
        };
    }>;
    removeCv(cvId: string, req: any): Promise<{
        message: string;
    }>;
}
