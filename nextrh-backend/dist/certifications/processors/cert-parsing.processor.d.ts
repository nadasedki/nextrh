import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CertificationsService } from '../services/certifications.service';
export declare class CertParsingProcessor extends WorkerHost {
    private readonly certService;
    private readonly logger;
    constructor(certService: CertificationsService);
    process(job: Job<any>): Promise<any>;
}
