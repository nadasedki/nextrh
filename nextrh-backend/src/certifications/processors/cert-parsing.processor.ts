import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CertificationsService } from '../services/certifications.service';

@Processor('cert-parsing', { concurrency: 1 })
export class CertParsingProcessor extends WorkerHost {
  private readonly logger = new Logger(CertParsingProcessor.name);

  constructor(private readonly certService: CertificationsService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { employeeId, fullDiskPath, relativePath, currentUserFullName } = job.data;
    this.logger.log(`[Job #${job.id}] Starting AI certificate extraction for Employee #${employeeId}...`);

    try {
      await job.updateProgress(20);

      // Runs the exact working extraction & validation logic
      const result = await this.certService.processCertificateFromDisk(
        employeeId,
        fullDiskPath,
        relativePath,
        currentUserFullName,
      );

      await job.updateProgress(100);
      this.logger.log(`[Job #${job.id}] Certificate extracted successfully for Employee #${employeeId}!`);

      return result; // 👈 Saved in Redis so status endpoint returns it to the frontend
    } catch (error: any) {
      this.logger.error(`[Job #${job.id}] FAILED: ${error.message}`);
      throw error;
    }
  }
}