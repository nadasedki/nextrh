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
import * as fs from 'fs';
import * as path from 'path';
import { Cv } from 'src/cvs/entities/cv.entity';
import { User } from 'src/users/entities/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CertificationsService {
 
  constructor(
    @InjectRepository(Certification)
    private readonly certificationRepo: Repository<Certification>,
    private readonly aiService: AiService,
   private eventEmitter: EventEmitter2,
  ) {}

  async findMyCertifications(employeeId: number) {
    const certs = await this.certificationRepo.find({
      where: { userId: employeeId },
      order: { expiryDate: 'ASC' },
      relations: ['user'], // Load user to map user_id safely if needed
    });
    
    // Map to Frontend format if necessary, or return as is
    return certs;
  }

  async create(employeeId: number, dto: CreateCertificationDto) {
    if (!dto.name || !dto.issuer) {
      throw new BadRequestException('Name and Issuer are required');
    }
const targetExpiry = dto.expirationDate ? new Date(dto.expirationDate) : null;
const calculatedStatus = this.calculateStatus(targetExpiry);

    const certification = this.certificationRepo.create({
      certName: dto.name,            // Updated property name
      provider: dto.issuer,          
      issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
      expiryDate: targetExpiry,
      credentialId: dto.credentialId,
      status: calculatedStatus,
      //user: { user_id: employeeId } as any
      userId: employeeId,
      filePath: dto.filePath || null,

    });

     const savedCert = await this.certificationRepo.save(certification);
     
 //3. ÉMISSION DE L'ÉVÉNEMENT (On envoie un "paquet" d'infos au Listener)
    this.eventEmitter.emit('certification.saved', { 
      certId: savedCert.certId,
      employeeId: employeeId, 
      certName: savedCert.certName, 
      expiryDate: savedCert.expiryDate 
    });

  return savedCert;
  }

  async update(id: number, employeeId: number, dto: UpdateCertificationDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No data provided for update');
    }

    const certification = await this.certificationRepo.findOne({
      where: { certId: id }, // Updated to 'certId'
      relations: ['user'],
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    if (certification.userId !== employeeId) {
      throw new ForbiddenException('You cannot modify this certification');
    }

    // Mapping
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
 //  ENVOI DE L'ÉVÉNEMENT (Correspond au type CertificationEventPayload du Listener)
    this.eventEmitter.emit('certification.updated', { 
      employeeId: employeeId, 
      certId: updatedCert.certId, 
    });
     return updatedCert;
  }

  async remove(id: number, employeeId: number) {
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
  }
 async createBulkFromParsedData(certsData: any[], userId: number, filePath?: string, cvEntity?: Cv) {
    if (!certsData || certsData.length === 0) return [];

    const entities = certsData.map((cert) => {
      return this.certificationRepo.create({
        certName: cert.certName,
        // We infer the provider from the name or default to 'Specified in cert'
        provider: cert.provider,
        issueDate: cert.issueDate,
        expiryDate: null, // Usually not clearly parsed as a single date from CVs
        status: 'active',
        userId: userId,
        filePath: filePath || null,
        cv: cvEntity, 
      });
    });

    return await this.certificationRepo.save(entities);
  }
  // This method is called from AiService after extracting cert data from Certif file alone 
  

//code to save certificate data to DB

/*
private calculateStatus(expirationDate: string | null) {
  if (!expirationDate) return 'active';

  const today = new Date();
  const expiry = new Date(expirationDate);

  if (isNaN(expiry.getTime())) return 'active';

  if (expiry < today) return 'expired';

  const diffDays =
    (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);

  if (diffDays <= 30) return 'expiring_soon';

  return 'active';
}
  */
// This method is called from CvParsingService after parsing cert data from CVs


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
/*private async syncToCalendar(userId: number, cert: Certification) {
  try {
    // 1. Récupérer les infos de l'employé (nom et email)
    const user = await this.userRepo.findOne({ where: { user_id: userId } });

    if (user && user.email && cert.expiryDate) {
      // 2. Appeler le service Google Calendar
      await this.googleCalendarService.scheduleEmployeeReminder(
        user.full_name,
        user.email,
        cert.certName,
        cert.expiryDate.toISOString(), // On envoie la date au format string
      );
      console.log(` Synchro Agenda réussie pour ${user.email}`);
    }
  } catch (err) {
    console.error(" Erreur de synchronisation Agenda:", err.message);
  }
}
  


private mapAiToEntity(aiData: any, filePath: string) {
  const status = this.calculateStatus(aiData.date_of_expiration);

  return {
    certName: aiData.certificate_name,    
    provider: aiData.provider,
    issueDate: aiData.date_of_obtention ? new Date(aiData.date_of_obtention) : null,
    expiryDate: aiData.date_of_expiration ? new Date(aiData.date_of_expiration) : null,
    credentialId: aiData.credential_id || null,
    status,
    filePath,
  };
}
 async extractAndSaveCertificate(
  employeeId: number,
  file: Express.Multer.File,
) {
  try {
    // -----------------------------
    //  Create user folder
    // -----------------------------
    const userFolder = path.join(
      process.cwd(),
      'uploads',
      `user_${employeeId}`,
    );

    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    // -----------------------------
    // Save file
    // -----------------------------
    const filePath = path.join(userFolder, file.originalname);
    fs.writeFileSync(filePath, file.buffer);

    // -----------------------------
    //  Call AI Service
    // -----------------------------
    const aiData = await this.aiService.extractCertificate(filePath);
    // Ensure we use the first object if LLM returned an array
    const certificateObj = Array.isArray(aiData) ? aiData[0] : aiData;
    if (!certificateObj || Object.keys(certificateObj).length === 0) {
      throw new Error('AI returned empty data');
    }

    console.log('AI Data:', certificateObj);

    // -----------------------------
    //  Map AI → DTO
    // -----------------------------
    const entityData = this.mapAiToEntity(certificateObj, filePath);

    // -----------------------------
    //  Save to Database
    // -----------------------------
    
   const savedCert = await this.create(employeeId, {
      name: entityData.certName,
      issuer: entityData.provider,
      issueDate: entityData.issueDate ? entityData.issueDate.toISOString() : null,
      expirationDate: entityData.expiryDate ? entityData.expiryDate.toISOString() : null,
      credentialId: entityData.credentialId,
      status: entityData.status as 'active' | 'expired' | 'expiring_soon',
      filePath: entityData.filePath,
    });
   return savedCert; 
  } catch (error) {
    console.error('Error saving certificate:', error.message);
    throw error;
  }
}*/
}