import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CvIngestionService } from '../cv-ingestion.service';
export declare class CvQueueProcessor extends WorkerHost {
    private readonly cvIngestionService;
    private readonly logger;
    constructor(cvIngestionService: CvIngestionService);
    process(job: Job<any>): Promise<any>;
}
