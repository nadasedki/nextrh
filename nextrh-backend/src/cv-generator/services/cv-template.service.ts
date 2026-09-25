// src/cv-generator/services/cv-template.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CvTemplate } from '../entities/cv-template.entity';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CvTemplateService {
  private readonly logger = new Logger(CvTemplateService.name);
  private readonly templateUploadDir: string;

  constructor(
    @InjectRepository(CvTemplate)
    private readonly templateRepo: Repository<CvTemplate>,
    private readonly configService: ConfigService,
    @InjectQueue('template-ingestion') private readonly ingestionQueue: Queue,
  ) {
    const configuredPath = this.configService.get<string>('UPLOAD_TEMPLATE_DESTINATION') || './uploads/templates';
    this.templateUploadDir = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
  }

  /**
   * Saves the original PDF to disk and enqueues the Vision AI ingestion job
   */
  async enqueueTemplateIngestion(file: Express.Multer.File, name: string, userId: number) {
    // 1. Save original PDF file to disk
    await fs.mkdir(this.templateUploadDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.pdf';
    const fileName = `template-${userId}-${Date.now()}${ext}`;
    const fullDiskPath = path.join(this.templateUploadDir, fileName);
    await fs.writeFile(fullDiskPath, file.buffer);
    const relativePdfPath = path.join('uploads', 'templates', fileName).replace(/\\/g, '/');

    // 2. Add job to BullMQ queue
    const job = await this.ingestionQueue.add(
      'ingest-template',
      {
        name,
        userId,
        fullDiskPath,
        relativePdfPath,
      },
      {
        attempts: 1,
        removeOnComplete: { age: 3600, count: 500 },
        removeOnFail: { age: 86400 },
      },
    );

    return {
      status: 'queued',
      message: 'Template uploaded and queued for AI visual extraction.',
      jobId: job.id,
    };
  }

  async getIngestionJobStatus(jobId: string) {
    const job = await this.ingestionQueue.getJob(jobId);
    if (!job) return { jobId, state: 'completed', status: 'completed', progress: 100 };

    const state = await job.getState();
    return {
      jobId: job.id,
      state,
      progress: job.progress,
      result: job.returnvalue || null,
      failedReason: job.failedReason || null,
    };
  }

  async getTemplateById(templateId: string): Promise<CvTemplate> {
    const template = await this.templateRepo.findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException(`Template #${templateId} not found.`);
    }
    return template;
  }

  async getSkeleton(templateId: string): Promise<string> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
      select: ['template_html'],
    });
    if (!template) {
      throw new NotFoundException(`Template #${templateId} not found.`);
    }
    return template.template_html;
  }

  async findAll(): Promise<CvTemplate[]> {
    return await this.templateRepo.find({
      select: ['id', 'name', 'template_html', 'original_pdf_url', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }

  async remove(templateId: string): Promise<void> {
    this.logger.log(`Deleting CV template #${templateId}`);
    const template = await this.getTemplateById(templateId);

    if (template.original_pdf_url) {
      try {
        const fullDiskPath = path.isAbsolute(template.original_pdf_url)
          ? template.original_pdf_url
          : path.join(process.cwd(), template.original_pdf_url);
        await fs.unlink(fullDiskPath);
      } catch (err: any) {
        this.logger.warn(`Could not delete template file: ${err.message}`);
      }
    }

    await this.templateRepo.remove(template);
  }
}