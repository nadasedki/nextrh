import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certification } from '../entities/certification.entity';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { AiService } from 'src/parser/ai.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Cv } from 'src/cvs/entities/cv.entity';
import { User } from 'src/users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CertificationsService {
private readonly certUploadDir: string;


  constructor(
    @InjectRepository(Certification)
    private readonly certificationRepo: Repository<Certification>,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
      const configuredPath = this.configService.get<string>('UPLOAD_CERT_DESTINATION') || './uploads/certifications';
    
    this.certUploadDir = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);

  }
  async saveCertFileToDisk(fileBuffer: Buffer, employeeId: number, originalName: string): Promise<string> {
  await fs.mkdir(this.certUploadDir, { recursive: true });
  const ext = path.extname(originalName) || '.pdf';
  const fileName = `cert-${employeeId}-${Date.now()}${ext}`;
  const fullPath = path.join(this.certUploadDir, fileName);
  await fs.writeFile(fullPath, fileBuffer);
  return `uploads/certifications/${fileName}`;
}

  async findMyCertifications(employeeId: number) {
    const certs = await this.certificationRepo.find({
      where: { userId: employeeId },
      order: { expiryDate: 'ASC' },
      relations: ['user'], 
    });
    

    return certs;
  }
async create(
  employeeId: number,
  dto: CreateCertificationDto,
  fileBuffer?: Buffer,      
  originalName?: string,    
) {
  if (!dto.name || !dto.issuer) {
    throw new BadRequestException('Name and Issuer are required');
  }

  
  let savedFilePath: string | null = dto.filePath || null;
  if (fileBuffer && originalName) {
    savedFilePath = await this.saveCertFileToDisk(fileBuffer, employeeId, originalName);
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
    filePath: savedFilePath, 
  });

  const savedCert = await this.certificationRepo.save(certification);

  this.eventEmitter.emit('certification.saved', {
    certId: savedCert.certId,
    employeeId: employeeId,
    certName: savedCert.certName,
    expiryDate: savedCert.expiryDate,
  });

  this.eventEmitter.emit('certification.index_saved', {
    entityId: savedCert.certId,
    userId: employeeId,
  });

  return savedCert;
}
 /* async create(employeeId: number, dto: CreateCertificationDto) {
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
      employeeId: employeeId, 
      certName: savedCert.certName, 
      expiryDate: savedCert.expiryDate 
    });

     this.eventEmitter.emit('certification.index_saved', { 
      entityId: savedCert.certId,
      userId: employeeId, 
    });
  return savedCert;
  }*/

  async update(id: number, employeeId: number, dto: UpdateCertificationDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No data provided for update');
    }

    const certification = await this.certificationRepo.findOne({
      where: { certId: id }, 
      relations: ['user'],
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    if (certification.userId !== employeeId) {
      throw new ForbiddenException('You cannot modify this certification');
    }

   
    if (dto.name) certification.certName = dto.name;
    if (dto.issuer) certification.provider = dto.issuer;
    if (dto.issueDate) certification.issueDate = new Date(dto.issueDate);
    if (dto.expirationDate) certification.expiryDate = new Date(dto.expirationDate);
    if (dto.credentialId !== undefined) certification.credentialId = dto.credentialId;
    if (dto.expirationDate !== undefined) {
    const targetExpiry = dto.expirationDate ? new Date(dto.expirationDate) : null;
    certification.expiryDate = targetExpiry;
    certification.status = this.calculateStatus(targetExpiry);
  } else if (dto.status) {
    // Si l'utilisateur force manuellement un statut sans toucher à la date
    certification.status = dto.status;
  }
      const updatedCert = await this.certificationRepo.save(certification);
 
      this.eventEmitter.emit('certification.updated', { 
      employeeId: employeeId, 
      certId: updatedCert.certId, 
    });
      this.eventEmitter.emit('certification.index_saved', { 
      entityId: updatedCert.certId,
      userId: employeeId, 
    });

     return updatedCert;
  }
async remove(id: number, employeeId: number) {
  const certification = await this.certificationRepo.findOne({
    where: { certId: id },
    relations: ['user'],
  });

  if (!certification) {
    throw new NotFoundException('Certification not found');
  }

  if (certification.userId !== employeeId) {
    throw new ForbiddenException('You cannot delete this certification');
  }

  // 1. Delete the physical certificate file from disk (if it has its own dedicated file)
  if (certification.filePath && !certification.filePath.includes('uploads/cvs/')) {
    try {
      const fullPath = path.join(process.cwd(), certification.filePath);
      await fs.unlink(fullPath);
    } catch (err) {
      // Ignore if file doesn't exist on disk
    }
  }

  // 2. Remove from database
  await this.certificationRepo.remove(certification);

  // 3. Emit events cleanly
  this.eventEmitter.emit('certification.deleted', {
    employeeId: employeeId,
    certId: id,
  });

  this.eventEmitter.emit('certification.index_deleted', {
    entityId: id,
    userId: employeeId,
  });
}
  /*async remove(id: number, employeeId: number) {
    const certification = await this.certificationRepo.findOne({
      where: { certId: id }, 
      relations: ['user'],
    });
  this.eventEmitter.emit('certification.deleted', { certId: id });
    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    if (certification.userId !== employeeId) {
      throw new ForbiddenException('You cannot delete this certification');
    }

    await  this.certificationRepo.remove(certification);
     // MISE À JOUR 
 this.eventEmitter.emit('certification.deleted', { 
      employeeId: employeeId, 
      certId: id 
    });

     this.eventEmitter.emit('certification.index_deleted', { 
      entityId: id,
      userId: employeeId, 
    });
  }*/
 async createBulkFromParsedData(certsData: any[], userId: number, filePath?: string, cvEntity?: Cv) {
    if (!certsData || certsData.length === 0) return [];

    const entities = certsData.map((cert) => {
      return this.certificationRepo.create({
        certName: cert.certName,
         provider: cert.provider,
        issueDate: cert.issue_date ,
        expiryDate: cert.expiry_date , 
        userId: userId,
        filePath: filePath || null,
        cv: cvEntity, 
      });
    });

    return await this.certificationRepo.save(entities);
  }
 

  /**
   * Helper: Converts "Février 2020" to a JavaScript Date object
   */
private calculateStatus(expiryDate: Date | string | null): string {
  if (!expiryDate) return 'active';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  // Si la date d'expiration est passée
  if (expiry < today) {
    return 'expired';
  }

  // Optionnel : Expire bientôt (ex: moins de 30 jours)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  if (expiry <= thirtyDaysFromNow) {
    return 'expiring_soon';
  }

  return 'active';
}
/**
 * Évalue toutes les certifications actives ou arrivant à expiration 
 * pour mettre à jour leur statut en Base de Données (ex: traitement quotidien/cron).
 */
async evaluateAllCertificationsStatus(): Promise<{ updatedCount: number }> {
  // 1. Récupérer toutes les certifications qui ont une date d'expiration
  const certifications = await this.certificationRepo.find({
    where: [
      { status: 'active' },
      { status: 'expiring_soon' }
    ]
  });

  let updatedCount = 0;

  for (const cert of certifications) {
    if (!cert.expiryDate) continue;

    // Calculer le nouveau statut théorique
    const newStatus = this.calculateStatus(cert.expiryDate);

    // Si le statut a changé, on met à jour et on émet un événement
    if (cert.status !== newStatus) {
      const oldStatus = cert.status;
      cert.status = newStatus;
      await this.certificationRepo.save(cert);
      updatedCount++;

      // Optionnel: Émettre un événement spécifique si le statut change (ex: envoyer un mail)
      this.eventEmitter.emit('certification.status.changed', {
        certId: cert.certId,
        employeeId: cert.userId,
        certName: cert.certName,
        oldStatus: oldStatus,
        newStatus: newStatus,
        expiryDate: cert.expiryDate
      });
    }
  }

  return { updatedCount };
}


}