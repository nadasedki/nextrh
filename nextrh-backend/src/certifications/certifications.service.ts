import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certification } from './entities/certification.entity';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { AiService } from 'src/parser/ai.service';
import * as fs from 'fs';
import * as path from 'path';
import { Cv } from 'src/cvs/entities/cv.entity';
import { User } from 'src/users/entities/user.entity';
import { GoogleCalendarService } from 'src/google-calendar/google-calendar.service';
@Injectable()
export class CertificationsService {
  constructor(
    @InjectRepository(Certification)
    private readonly certificationRepo: Repository<Certification>,
    private readonly aiService: AiService,
     @InjectRepository(User) 
    private readonly userRepo: Repository<User>, 
  private readonly googleCalendarService: GoogleCalendarService, 
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

    const certification = this.certificationRepo.create({
      certName: dto.name,            // Updated property name
      provider: dto.issuer,          
      issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
      expiryDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
      credentialId: dto.credentialId,
      status: dto.status || 'active',
      //user: { user_id: employeeId } as any
      userId: employeeId,
      filePath: dto.filePath || null,

    });

     const savedCert = await this.certificationRepo.save(certification);

  // --- AJOUT ICI ---
  if (savedCert.expiryDate) {
    await this.syncToCalendar(employeeId, savedCert);
  }

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
    if (dto.status) certification.status = dto.status;

    return this.certificationRepo.save(certification);
  }

  async remove(id: number, employeeId: number) {
    const certification = await this.certificationRepo.findOne({
      where: { certId: id }, // Updated to 'certId'
      relations: ['user'],
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    if (certification.userId !== employeeId) {
      throw new ForbiddenException('You cannot delete this certification');
    }

    return this.certificationRepo.remove(certification);
  }

  // This method is called from AiService after extracting cert data from Certif file alone 
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
    const certification = this.certificationRepo.create({
      ...entityData,
      userId: employeeId,
    });

    const savedCert = await this.certificationRepo.save(certification);

    // --- AJOUT ICI ---
    if (savedCert.expiryDate) {
      await this.syncToCalendar(employeeId, savedCert);
    }


  } catch (error) {
    console.error('Error saving certificate:', error.message);
    throw error;
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
//code to save certificate data to DB


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
// This method is called from CvParsingService after parsing cert data from CVs
 async createBulkFromParsedData(certsData: any[], userId: number, filePath?: string, cvEntity?: Cv) {
    if (!certsData || certsData.length === 0) return [];

    const entities = certsData.map((cert) => {
      return this.certificationRepo.create({
        certName: cert.certName,
        // We infer the provider from the name or default to 'Specified in cert'
        provider: this.inferProvider(cert.certName),
        issueDate: this.parseFrenchDate(cert.date),
        expiryDate: null, // Usually not clearly parsed as a single date from CVs
        status: 'active',
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
  private parseFrenchDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.toLowerCase().includes('non spécifiée')) return null;

    const months: Record<string, number> = {
      janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
      juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
    };

    const parts = dateStr.toLowerCase().split(/\s+/); // ["février", "2020"]
    const year = parts.find((p) => /\d{4}/.test(p));
    const monthName = parts.find((p) => months[p] !== undefined);

    if (year) {
      const m = monthName ? months[monthName] : 0;
      return new Date(parseInt(year), m, 1);
    }
    return null;
  }

  /**
   * Helper: Guesses the provider based on common certification names
   */
  private inferProvider(certName: string): string {
    const name = certName.toLowerCase();
    if (name.includes('cisco') || name.includes('ccna') || name.includes('ccnp')) return 'Cisco';
    if (name.includes('fortinet') || name.includes('nse')) return 'Fortinet';
    if (name.includes('microsoft') || name.includes('azure') || name.includes('mcsa')) return 'Microsoft';
    if (name.includes('aws') || name.includes('amazon')) return 'AWS';
    if (name.includes('dell')) return 'DELL';
    if (name.includes('hp')) return 'HP';
    return 'Professional Issuer';
  }
private async syncToCalendar(userId: number, cert: Certification) {
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
 
}