import { CvService } from './cv.service';
export declare class CvController {
    private readonly cvService;
    constructor(cvService: CvService);
    uploadCv(req: any, file: Express.Multer.File): Promise<{
        status: string;
        message: string;
        jobId: string;
    }>;
    getJobStatus(jobId: string): Promise<{
        jobId: string;
        state: string;
        status: string;
        progress: number;
        result?: undefined;
        failedReason?: undefined;
    } | {
        jobId: string;
        state: import("bullmq").JobState | "unknown";
        progress: import("bullmq").JobProgress;
        result: any;
        failedReason: string;
        status?: undefined;
    }>;
    removeCv(cvId: string, req: any): Promise<{
        message: string;
    }>;
}
