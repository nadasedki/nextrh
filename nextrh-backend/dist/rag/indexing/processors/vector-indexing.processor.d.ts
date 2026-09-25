import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IndexingService } from '../indexing.service';
export declare class VectorIndexingProcessor extends WorkerHost {
    private readonly indexingService;
    private readonly logger;
    constructor(indexingService: IndexingService);
    process(job: Job<any>): Promise<any>;
}
