import { Repository } from 'typeorm';
import { Certification } from '../entities/certification.entity';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { AiService } from 'src/parser/ai.service';
import { Cv } from 'src/cvs/entities/cv.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
export declare class CertificationsService {
    private readonly certificationRepo;
    private readonly aiService;
    private readonly configService;
    private readonly eventEmitter;
    private readonly certQueue;
    private readonly logger;
    private readonly certUploadDir;
    constructor(certificationRepo: Repository<Certification>, aiService: AiService, configService: ConfigService, eventEmitter: EventEmitter2, certQueue: Queue);
    enqueueCertParsing(employeeId: number, file: Express.Multer.File, currentUserFullName: string): Promise<{
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
    processCertificateFromDisk(employeeId: number, fullDiskPath: string, relativePath: string, currentUserFullName: string): Promise<{
        certName: any;
        provider: any;
        issueDate: string;
        expiryDate: string;
        holderName: any;
        status: "active" | "expiring_soon" | "expired";
        filePath: string;
    }>;
    findMyCertifications(employeeId: number): Promise<Certification[]>;
    create(employeeId: number, dto: CreateCertificationDto): Promise<Certification>;
    update(id: number, employeeId: number, dto: UpdateCertificationDto): Promise<Certification>;
    remove(id: number, employeeId: number): Promise<void>;
    createBulkFromParsedData(certsData: any[], userId: number, filePath?: string, cvEntity?: Cv): Promise<Certification[]>;
    calculateStatus(expiryDate: Date | string | null): 'active' | 'expired' | 'expiring_soon';
    private formatDateToISO;
    evaluateAllCertificationsStatus(): Promise<{
        updatedCount: number;
    }>;
}
