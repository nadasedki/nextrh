import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certification } from '../entities/certification.entity';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { AiService } from 'src/parser/ai.service';
import { Cv } from 'src/cvs/entities/cv.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq'; 
import { Queue } from 'bullmq';            
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CertificationsService {
  private readonly logger = new Logger(CertificationsService.name);
  private readonly certUploadDir: string;

  constructor(
    @InjectRepository(Certification)
    private readonly certificationRepo: Repository<Certification>,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('cert-parsing') private readonly certQueue: Queue, // 👈 Injected Queue
  ) {
    const configuredPath = this.configService.get<string>('UPLOAD_CERT_DESTINATION') || './uploads/certifications';
    this.certUploadDir = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
  }

   async enqueueCertParsing(employeeId: number, file: Express.Multer.File, currentUserFullName: string) {
    // 1. Save file to disk first
    await fs.mkdir(this.certUploadDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.pdf';
    const fileName = `cert-${employeeId}-${Date.now()}${ext}`;
    const fullDiskPath = path.join(this.certUploadDir, fileName);
    await fs.writeFile(fullDiskPath, file.buffer);

    const relativePath = path.join('uploads', 'certifications', fileName).replace(/\\/g, '/');

    // 2. Add job to Redis Queue (1 attempt only so invalid files are not retried)
    const job = await this.certQueue.add(
      'parse-certificate',
      {
        employeeId,
        fullDiskPath,
        relativePath,
        currentUserFullName,
        originalName: file.originalname,
      },
      {
        attempts: 1,
        removeOnComplete: { age: 3600, count: 500 }, // Keep completed in Redis for 1h so status endpoint can read result
        removeOnFail: { age: 86400 },
      },
    );

    return {
      status: 'queued',
      message: 'Certificate uploaded and queued for AI analysis.',
      jobId: job.id,
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.certQueue.getJob(jobId);

    if (!job) {
      return { jobId, state: 'completed', status: 'completed', progress: 100 };
    }

    const state = await job.getState();
    return {
      jobId: job.id,
      state,
      progress: job.progress,
      result: job.returnvalue || null,
      failedReason: job.failedReason || null,
    };
  }

   async processCertificateFromDisk(
    employeeId: number,
    fullDiskPath: string,
    relativePath: string,
    currentUserFullName: string,
  ) {
    try {
      // 1. AI Extraction
      const aiData = await this.aiService.extractCertificate(fullDiskPath);
      const certObj = Array.isArray(aiData) ? aiData[0] : aiData;

      if (!certObj || Object.keys(certObj).length === 0) {
        throw new BadRequestException('AI could not extract valid data from document.');
      }

      // 2. Security Validation: Identity Check
      const extractedHolder = (certObj.certificate_holder || certObj.holder_name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const expectedHolder = (currentUserFullName || '').trim().toLowerCase().replace(/\s+/g, ' ');

      if (!expectedHolder) {
        throw new BadRequestException('User profile name could not be verified from token.');
      }

      if (extractedHolder && !expectedHolder.includes(extractedHolder) && !extractedHolder.includes(expectedHolder)) {
        await fs.unlink(fullDiskPath).catch(() => {});
        throw new BadRequestException(
          `Identity mismatch: This certificate belongs to "${certObj.certificate_holder}", not "${currentUserFullName}".`
        );
      }

      // 3. Format Dates and calculate status
      const issueDate = this.formatDateToISO(certObj.date_of_obtention || certObj.issue_date);
      const expiryDate = this.formatDateToISO(certObj.date_of_expiration || certObj.expiry_date);
      const status = this.calculateStatus(expiryDate);

      return {
        certName: certObj.certificate_name || certObj.name || 'Certificate',
        provider: certObj.provider || certObj.issuer || 'Provider',
        issueDate,
        expiryDate,
        holderName: certObj.certificate_holder || currentUserFullName,
        status,
        filePath: relativePath,
      };
    } catch (error: any) {
      this.logger.error(`Certificate parsing failed: ${error.message}`);
      await fs.unlink(fullDiskPath).catch(() => {});
      throw error;
    }
  }

  async findMyCertifications(employeeId: number) {
    return await this.certificationRepo.find({
      where: { userId: employeeId },
      order: { expiryDate: 'ASC' },
      relations: ['user'],
    });
  }

  async create(employeeId: number, dto: CreateCertificationDto) {
    if (!dto.name || !dto.issuer) {
      throw new BadRequestException('Name and Issuer are required');
    }

    const targetExpiry = dto.expirationDate ? new Date(dto.expirationDate) : null;
    const calculatedStatus = this.calculateStatus(targetExpiry);

    const certification = this.certificationRepo.create({
      certName: dto.name,
      provider: dto.issuer,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
      expiryDate: targetExpiry,
      credentialId: dto.credentialId,
      status: calculatedStatus,
      userId: employeeId,
      filePath: dto.filePath || null,
    });

    const savedCert = await this.certificationRepo.save(certification);

    this.eventEmitter.emit('certification.saved', {
      certId: savedCert.certId,
      employeeId,
      certName: savedCert.certName,
      expiryDate: savedCert.expiryDate,
    });

    this.eventEmitter.emit('certification.index_saved', {
      entityId: savedCert.certId,
      userId: employeeId,
    });

    return savedCert;
  }

  async update(id: number, employeeId: number, dto: UpdateCertificationDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No data provided for update');
    }

    const certification = await this.certificationRepo.findOne({
      where: { certId: id },
      relations: ['user'],
    });

    if (!certification) throw new NotFoundException('Certification not found');
    if (certification.userId !== employeeId) throw new ForbiddenException('Unauthorized access');

    if (dto.name) certification.certName = dto.name;
    if (dto.issuer) certification.provider = dto.issuer;
    if (dto.issueDate) certification.issueDate = new Date(dto.issueDate);
    if (dto.credentialId !== undefined) certification.credentialId = dto.credentialId;
    
    if (dto.expirationDate !== undefined) {
      const targetExpiry = dto.expirationDate ? new Date(dto.expirationDate) : null;
      certification.expiryDate = targetExpiry;
      certification.status = this.calculateStatus(targetExpiry);
    } else if (dto.status) {
      certification.status = dto.status;
    }

    const updatedCert = await this.certificationRepo.save(certification);

    this.eventEmitter.emit('certification.updated', { employeeId, certId: updatedCert.certId });
    this.eventEmitter.emit('certification.index_saved', { entityId: updatedCert.certId, userId: employeeId });

    return updatedCert;
  }

  async remove(id: number, employeeId: number) {
    const certification = await this.certificationRepo.findOne({
      where: { certId: id },
      relations: ['user'],
    });

    if (!certification) throw new NotFoundException('Certification not found');
    if (certification.userId !== employeeId) throw new ForbiddenException('Unauthorized access');

    if (certification.filePath && !certification.filePath.includes('uploads/cvs/')) {
      try {
        const fullDiskPath = path.isAbsolute(certification.filePath)
          ? certification.filePath
          : path.join(process.cwd(), certification.filePath);
        await fs.unlink(fullDiskPath);
      } catch (err: any) {
        this.logger.warn(`Could not delete file: ${err.message}`);
      }
    }

    await this.certificationRepo.remove(certification);

    this.eventEmitter.emit('certification.deleted', { employeeId, certId: id });
    this.eventEmitter.emit('certification.index_deleted', { entityId: id, userId: employeeId });
  }

  async createBulkFromParsedData(certsData: any[], userId: number, filePath?: string, cvEntity?: Cv) {
    if (!certsData || certsData.length === 0) return [];

    const entities = certsData.map((cert) => {
      const targetExpiry = cert.expiry_date ? new Date(cert.expiry_date) : null;
      return this.certificationRepo.create({
        certName: cert.certName || cert.cert_name,
        provider: cert.provider,
        issueDate: cert.issue_date ? new Date(cert.issue_date) : null,
        expiryDate: targetExpiry,
        status: this.calculateStatus(targetExpiry),
        userId,
        filePath: filePath || null,
        cv: cvEntity,
      });
    });

    return await this.certificationRepo.save(entities);
  }

  public calculateStatus(expiryDate: Date | string | null): 'active' | 'expired' | 'expiring_soon' {
    if (!expiryDate) return 'active';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    if (isNaN(expiry.getTime())) return 'active';
    if (expiry < today) return 'expired';

    const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
    if (diffDays <= 30) return 'expiring_soon';

    return 'active';
  }

  private formatDateToISO(dateStr: string | null | undefined): string | null {
    if (!dateStr || String(dateStr).trim().toLowerCase() === 'null') return null;

    let cleanedStr = dateStr
      .trim()
      .replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)[,\s]+/i, '')
      .replace(/janvier/i, 'January').replace(/fevrier/i, 'February').replace(/mars/i, 'March')
      .replace(/avril/i, 'April').replace(/mai/i, 'May').replace(/juin/i, 'June')
      .replace(/juillet/i, 'July').replace(/aout/i, 'August').replace(/septembre/i, 'September')
      .replace(/octobre/i, 'October').replace(/novembre/i, 'November').replace(/decembre/i, 'December');

    const timestamp = Date.parse(cleanedStr);
    if (isNaN(timestamp)) return null;

    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async evaluateAllCertificationsStatus(): Promise<{ updatedCount: number }> {
    const certifications = await this.certificationRepo.find({
      where: [{ status: 'active' }, { status: 'expiring_soon' }]
    });

    let updatedCount = 0;

    for (const cert of certifications) {
      if (!cert.expiryDate) continue;

      const newStatus = this.calculateStatus(cert.expiryDate);

      if (cert.status !== newStatus) {
        const oldStatus = cert.status;
        cert.status = newStatus;
        await this.certificationRepo.save(cert);
        updatedCount++;

        this.eventEmitter.emit('certification.status.changed', {
          certId: cert.certId,
          employeeId: cert.userId,
          certName: cert.certName,
          oldStatus,
          newStatus,
          expiryDate: cert.expiryDate
        });
      }
    }

    return { updatedCount };
  }
}