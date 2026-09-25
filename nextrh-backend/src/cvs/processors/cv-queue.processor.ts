// in src/cvs/processors/cv-queue.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CvIngestionService } from '../cv-ingestion.service';
import * as fs from 'fs/promises';

@Processor('cv-parsing', { concurrency: 1 })
export class CvQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(CvQueueProcessor.name);

  constructor(private readonly cvIngestionService: CvIngestionService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { userId, fullDiskPath, relativePath, originalName } = job.data;
    this.logger.log(`[Job #${job.id}] Starting AI background parsing for User #${userId}...`);

    try {
      // 1. Read file directly from the full disk path (C:\nextrh_data\uploads\cvs\...)
      const fileBuffer = await fs.readFile(fullDiskPath);
      await job.updateProgress(20);

      // 2. Run parsing pipeline & save to database
      const result = await this.cvIngestionService.ingestCv(
        fileBuffer, 
        userId, 
        originalName,
        relativePath //  Pass the already saved path so it doesn't create duplicate files
      );

      await job.updateProgress(100);
      this.logger.log(`[Job #${job.id}] Finished parsing successfully for User #${userId}!`);

      return { cvId: result.cvId, status: 'completed' };
    } catch (error: any) {
      this.logger.error(`[Job #${job.id}] FAILED: ${error.message}`, error.stack);
      throw error;
    }
  }
}