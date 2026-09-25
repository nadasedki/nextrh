// in src/cvs/cv.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cv } from './entities/cv.entity';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EventEmitter2 } from '@nestjs/event-emitter'; 
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq'; // 👈 1. Import InjectQueue
import { Queue } from 'bullmq';              // 👈 2. Import Queue
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CvService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Cv)
    private cvRepository: Repository<Cv>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2, 
    private readonly configService: ConfigService,
    @InjectQueue('cv-parsing') private readonly cvQueue: Queue, // 👈 3. Inject BullMQ Queue here!
  ) {
    const configuredPath = this.configService.get<string>('UPLOAD_DESTINATION') || './uploads/cvs';
    this.uploadDir = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
  }

  // =========================================================================
  // 👈 NEW METHOD 1: Save file & push background parsing job to Redis Queue
  // =========================================================================
  async enqueueCvUpload(userId: number, file: Express.Multer.File) {
    // 1. Save physical PDF to disk
    await fs.mkdir(this.uploadDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.pdf';
    const fileName = `cv-${userId}-${Date.now()}${ext}`;
    const fullDiskPath = path.join(this.uploadDir, fileName);
    await fs.writeFile(fullDiskPath, file.buffer);

    const relativePath = path.join('uploads', 'cvs', fileName).replace(/\\/g, '/');

    // 2. Add job to Redis Queue
    const job = await this.cvQueue.add(
      'parse-cv',
      {
        userId,
        fullDiskPath,
        relativePath,
        originalName: file.originalname,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { age: 3600, count: 500 }, // Keep completed job in Redis for 1 hour
        removeOnFail: { age: 86400 },
      },
    );

    // 3. Return response with jobId
    return {
      status: 'queued',
      message: 'CV uploaded successfully and is being processed in the background.',
      jobId: job.id,
    };
  }

  // =========================================================================
  // 👈 NEW METHOD 2: Check job progress (waiting, active, completed, failed)
  // =========================================================================
  async getJobStatus(jobId: string) {
    const job = await this.cvQueue.getJob(jobId);

    if (!job) {
      return { 
        jobId, 
        state: 'completed', 
        status: 'completed', 
        progress: 100 
      };
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

  // =========================================================================
  // YOUR EXISTING METHODS (Unchanged)
  // =========================================================================
  async saveIdentityCv(userId: number, filePath: string, cvJson: any): Promise<Cv> {
    const profile = cvJson.profile || cvJson.personal_info || cvJson;
    const skillsValue = Array.isArray(profile.skills)
      ? profile.skills.join(', ')
      : (profile.skills || '');

    const cv = this.cvRepository.create({
      user_id: userId,
      file_path: filePath,
      format: 'pdf',
      generated: true,
      full_name: profile.name || profile.full_name,
      profession: profile.profession,
      email: profile.email,
      phone: profile.phone,
      fax: profile.fax,
      address: profile.address,
      skills: skillsValue,
    });

    return await this.cvRepository.save(cv);
  }

  async getFullCvData(cvId: number) {
    const [cv] = await this.dataSource.query('SELECT * FROM cvs WHERE cv_id = $1', [cvId]);
    if (!cv) throw new NotFoundException('CV non trouvé');

    const [certs, edus, projs, exps] = await Promise.all([
      this.dataSource.query('SELECT cert_name, provider, issue_date, expiry_date FROM certifications WHERE "cvCvId"=$1 ORDER BY issue_date DESC', [cvId]),
      this.dataSource.query('SELECT degree, institution, start_year, end_year FROM educations WHERE "cvCvId"=$1 ', [cvId]),
      this.dataSource.query('SELECT name, client, role, description, end_date, start_date FROM projects WHERE "cvCvId"=$1 ORDER BY end_date DESC', [cvId]),
      this.dataSource.query('SELECT company, role, start_date, end_date, description FROM experiences WHERE "cvCvId"=$1 ORDER BY end_date DESC', [cvId]),
    ]);
    
    let skillsArray = [];
    if (cv.skills) {
      skillsArray = String(cv.skills)
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    return {
      ...cv,
      phone: cv.phone || '',       
      address: cv.address || '',
      certifications: certs,
      education: edus,
      projects: projs.map(p => ({ ...p, year: p.end_date ? new Date(p.end_date).getFullYear() : '' })),
      experiences: exps.map(exp => ({
        ...exp,
        start_date: exp.start_date
          ? format(new Date(exp.start_date), 'MMMM yyyy', { locale: fr })
          : 'Présent',
        end_date: exp.end_date
          ? format(new Date(exp.end_date), 'MMMM yyyy', { locale: fr })
          : 'Présent',
      })),
      skills: skillsArray, 
    };
  }

  async remove(cvId: number, userId: number): Promise<void> {
    const cv = await this.cvRepository.findOne({ where: { cv_id: cvId } });
    if (!cv) {
      throw new NotFoundException('CV non trouvé');
    }

    if (cv.file_path) {
      try {
        const fileName = path.basename(cv.file_path); 
        const fullDiskPath = path.join(this.uploadDir, fileName); 
        await fs.unlink(fullDiskPath);
      } catch (err) {
        // continue
      }
    }
   
    await this.cvRepository.remove(cv);

    this.eventEmitter.emit('cv.deleted', {
      entityId: cvId,
      userId: userId,
    });
  }

  async findByUserId(userId: number): Promise<Cv | null> {
    return this.cvRepository.findOne({ where: { user_id: userId } });
  }
}