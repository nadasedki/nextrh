// src/cv-generator/processors/cv-generation.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CvGeneratorService } from '../services/cv-generator.service';

@Processor('cv-generation', { concurrency: 1 })
export class CvGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(CvGenerationProcessor.name);

  constructor(private readonly cvGeneratorService: CvGeneratorService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { templateId, userId } = job.data;
    this.logger.log(`[Job #${job.id}] Executing background CV compilation...`);

    try {
      await job.updateProgress(20);
      const result = await this.cvGeneratorService.compileAndRenderPdf(templateId, userId);
      await job.updateProgress(100);
      this.logger.log(` [Job #${job.id}] COMPLETED: CV generated successfully Download ready at: ${result.downloadUrl}`);


      return result;
    } catch (error: any) {
      this.logger.error(`[Job #${job.id}] Generation failed: ${error.message}`);
      throw error;
    }
  }
}