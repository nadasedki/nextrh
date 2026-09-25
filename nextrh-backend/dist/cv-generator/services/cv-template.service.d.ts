import { Repository } from 'typeorm';
import { CvTemplate } from '../entities/cv-template.entity';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
export declare class CvTemplateService {
    private readonly templateRepo;
    private readonly configService;
    private readonly ingestionQueue;
    private readonly logger;
    private readonly templateUploadDir;
    constructor(templateRepo: Repository<CvTemplate>, configService: ConfigService, ingestionQueue: Queue);
    enqueueTemplateIngestion(file: Express.Multer.File, name: string, userId: number): Promise<{
        status: string;
        message: string;
        jobId: string;
    }>;
    getIngestionJobStatus(jobId: string): Promise<{
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
    getTemplateById(templateId: string): Promise<CvTemplate>;
    getSkeleton(templateId: string): Promise<string>;
    findAll(): Promise<CvTemplate[]>;
    remove(templateId: string): Promise<void>;
}
