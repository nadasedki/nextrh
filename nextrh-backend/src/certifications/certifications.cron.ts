import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CertificationsService } from './services/certifications.service';

@Injectable()
export class CertificationsCron {
  private readonly logger = new Logger(CertificationsCron.name);

  constructor(private readonly certificationsService: CertificationsService) {}

  // S'exécute automatiquement tous les jours à minuit
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyCertificationEvaluation() {
    this.logger.log('Starting daily certifications status evaluation...');
    
    const result = await this.certificationsService.evaluateAllCertificationsStatus();
    
    this.logger.log(`Evaluation finished. Updated ${result.updatedCount} certifications.`);
  }
}