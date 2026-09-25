import { CvTemplateService } from './services/cv-template.service';
import { CvGeneratorService } from './services/cv-generator.service';
import { Response } from 'express';
export declare class CvGeneratorController {
    private readonly templateService;
    private readonly generatorService;
    constructor(templateService: CvTemplateService, generatorService: CvGeneratorService);
    uploadTemplate(file: Express.Multer.File, name: string, req: any): Promise<{
        status: string;
        message: string;
        jobId: string;
    }>;
    getTemplateIngestionStatus(jobId: string): Promise<{
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
    getTemplates(): Promise<import("./entities/cv-template.entity").CvTemplate[]>;
    deleteTemplate(id: string): Promise<{
        message: string;
    }>;
    generateCv(templateId: string, userId: number): Promise<{
        status: string;
        message: string;
        jobId: string;
    }>;
    getCvGenerationStatus(jobId: string): Promise<{
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
    downloadGeneratedPdf(fileName: string, res: Response): Promise<void>;
}
