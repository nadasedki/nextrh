import { CertificationsService } from './services/certifications.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
export declare class CertificationsController {
    private readonly certificationsService;
    constructor(certificationsService: CertificationsService);
    getMyCertifications(req: any): Promise<import("./entities/certification.entity").Certification[]>;
    create(req: any, dto: CreateCertificationDto): Promise<import("./entities/certification.entity").Certification>;
    update(id: number, req: any, dto: UpdateCertificationDto): Promise<import("./entities/certification.entity").Certification>;
    remove(id: number, req: any): Promise<void>;
    parseCertificatePreview(file: Express.Multer.File, req: any): Promise<{
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
}
