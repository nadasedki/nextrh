import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CvGeneratorService } from '../services/cv-generator.service';
export declare class CvGenerationProcessor extends WorkerHost {
    private readonly cvGeneratorService;
    private readonly logger;
    constructor(cvGeneratorService: CvGeneratorService);
    process(job: Job<any>): Promise<any>;
}
