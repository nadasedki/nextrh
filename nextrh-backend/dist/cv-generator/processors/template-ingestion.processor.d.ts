import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CvTemplateIngestionService } from '../services/cv-template-ingestion.service';
export declare class TemplateIngestionProcessor extends WorkerHost {
    private readonly ingestionService;
    private readonly logger;
    constructor(ingestionService: CvTemplateIngestionService);
    process(job: Job<any>): Promise<any>;
}
