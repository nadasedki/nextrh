// src/cv-generator/processors/template-ingestion.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CvTemplateIngestionService } from '../services/cv-template-ingestion.service';

@Processor('template-ingestion', { concurrency: 1 })
export class TemplateIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(TemplateIngestionProcessor.name);

  constructor(private readonly ingestionService: CvTemplateIngestionService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { fullDiskPath, relativePdfPath, name, userId } = job.data;
    this.logger.log(`[Job #${job.id}] Starting layout extraction for template: "${name}"...`);

    try {
      await job.updateProgress(20);
      const result = await this.ingestionService.ingestTemplateFromDisk(
        fullDiskPath,
        relativePdfPath,
        name,
        userId,
      );
      await job.updateProgress(100);
       this.logger.log(`[Job #${job.id}] COMPLETED: Template ingestion successfull`);
    
      return result;
    } catch (error: any) {
      this.logger.error(`[Job #${job.id}] Ingestion failed: ${error.message}`);
      throw error;
    }
  }
}