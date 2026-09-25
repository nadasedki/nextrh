import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IndexingService } from '../indexing.service';

@Processor('vector-indexing', { concurrency: 1 }) export class VectorIndexingProcessor extends WorkerHost {
  private readonly logger = new Logger(VectorIndexingProcessor.name);

  constructor(private readonly indexingService: IndexingService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`[Job #${job.id}] Processing vector task: "${job.name}"...`);

    switch (job.name) {
      case 'index-user': {
        const { userId } = job.data;
        await job.updateProgress(25);
        const result = await this.indexingService.reindexUser(userId);
        await job.updateProgress(100);
        this.logger.log(`[Job #${job.id}] User #${userId} indexed successfully (${result.points} vectors)`);
        return result;
      }

      case 'reindex-all': {
        await job.updateProgress(10);
        const result = await this.indexingService.indexAllCVs();
        await job.updateProgress(100);
        this.logger.log(`[Job #${job.id}] Full database re-indexing complete!`);
        return result;
      }

      case 'delete-user-vectors': {
        const { userId } = job.data;
        await this.indexingService.deleteUserVectors(userId);
        this.logger.log(`[Job #${job.id}] User #${userId} vectors deleted successfully.`);
        return { status: 'deleted', userId };
      }

      default:
        this.logger.warn(`[Job #${job.id}] Unknown vector job name: ${job.name}`);
        return null;
    }
  }
}