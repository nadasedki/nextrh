import { DataSource, Repository } from 'typeorm';
import { Cv } from './entities/cv.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
export declare class CvService {
    private cvRepository;
    private dataSource;
    private readonly eventEmitter;
    private readonly configService;
    private readonly cvQueue;
    private readonly uploadDir;
    constructor(cvRepository: Repository<Cv>, dataSource: DataSource, eventEmitter: EventEmitter2, configService: ConfigService, cvQueue: Queue);
    enqueueCvUpload(userId: number, file: Express.Multer.File): Promise<{
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
    saveIdentityCv(userId: number, filePath: string, cvJson: any): Promise<Cv>;
    getFullCvData(cvId: number): Promise<any>;
    remove(cvId: number, userId: number): Promise<void>;
    findByUserId(userId: number): Promise<Cv | null>;
}
