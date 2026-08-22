import { Injectable, BadRequestException } from '@nestjs/common';
import { AiService } from 'src/parser/ai.service';
import { CertificationsService } from './certifications.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CertificationsParserService {
  constructor(
    private readonly aiService: AiService,
    private readonly certsService: CertificationsService,
  ) {}

  /**
   * Orchestre l'enregistrement physique du fichier, l'extraction OCR/LLM via AiService
   * et la sauvegarde finale en base de données.
   */
 async extractAndPreviewCertificate(
  employeeId: number, 
  file: Express.Multer.File,
  currentUserFullName: string 
) {
  try {
    // 1. Gestion de l'infrastructure locale
    const userFolder = path.join(process.cwd(), 'uploads', `user_${employeeId}`);
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    const filePath = path.join(userFolder, file.originalname);
    fs.writeFileSync(filePath, file.buffer);

    // 2. Extraction par Intelligence Artificielle
    const aiData = await this.aiService.extractCertificate(filePath);
    const certificateObj = Array.isArray(aiData) ? aiData[0] : aiData;
    
    if (!certificateObj || Object.keys(certificateObj).length === 0) {
      throw new BadRequestException('AI returned empty or unreadable data');
    }

    console.log(' [AI Extraction Success]:', certificateObj);
    
    const isFailedExtraction = 
      (!certificateObj.certificate_name || String(certificateObj.certificate_name).trim().toLowerCase() === 'null') &&
      (!certificateObj.provider || String(certificateObj.provider).trim().toLowerCase() === 'null');

    if (isFailedExtraction) {
      console.warn(` [Parser-Orchestrator]: Extraction failed for file ${file.originalname}.`);
      throw new BadRequestException('Extraction failed: The document does not contain valid certificate data.');
    }

   //  ---  VALIDATION  ---
const extractedHolder = certificateObj.certificate_holder ? String(certificateObj.certificate_holder).trim().toLowerCase() : '';
const expectedHolder = currentUserFullName ? String(currentUserFullName).trim().toLowerCase() : '';


if (!expectedHolder) {
  console.error(' Alerte Sécurité: FullName est VIDE ou UNDEFINED. Le JWT ne transmet pas le nom.');
  throw new BadRequestException('User profile name could not be verified from token.');
}

// Comparaison stricte (en ignorant les doubles espaces accidentels)
const cleanExtracted = extractedHolder.replace(/\s+/g, ' ');
const cleanExpected = expectedHolder.replace(/\s+/g, ' ');

if (cleanExtracted !== cleanExpected) {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  
  throw new BadRequestException(
    `Identity mismatch: This certificate belongs to "${certificateObj.certificate_holder}", not you.`
  );
}
// ----------------------------------------------------

    // 3. Post-processing : Standardisation des dates
    const standardizedIssueDate = this.formatDateToISO(certificateObj.date_of_obtention);
    const standardizedExpiryDate = this.formatDateToISO(certificateObj.date_of_expiration);
    const status = this.calculateStatus(standardizedExpiryDate);

    // 4. Renvoi des données valides
    return {
      certName: certificateObj.certificate_name,
      provider: certificateObj.provider,
      issueDate: standardizedIssueDate,
      expiryDate: standardizedExpiryDate,
      holderName: certificateObj.holder_name || 'Unknown',
      status: status,
      filePath: filePath,
    };

  } catch (error) {
    console.error(' [Parser-Orchestrator Error]:', error.message);
    throw error;
  }
}

  private calculateStatus(expirationDate: string | null): 'active' | 'expired' | 'expiring_soon' {
    if (!expirationDate) return 'active';

    const today = new Date();
    const expiry = new Date(expirationDate);

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
  if (isNaN(timestamp)) return null; // Si le format reste illisible, on sécurise en DB avec un null

  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`; // Format YYYY-MM-DD parfait pour PostgreSQL / MySQL
}
}

   /*async extractAndSaveCertificate(employeeId: number, file: Express.Multer.File) {
    try {
      // 1. Gestion de l'infrastructure locale (Dossier uploads)
      const userFolder = path.join(process.cwd(), 'uploads', `user_${employeeId}`);
      if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
      }

      const filePath = path.join(userFolder, file.originalname);
      fs.writeFileSync(filePath, file.buffer);

      // 2. Extraction par Intelligence Artificielle
      const aiData = await this.aiService.extractCertificate(filePath);
      const certificateObj = Array.isArray(aiData) ? aiData[0] : aiData;
      
      if (!certificateObj || Object.keys(certificateObj).length === 0) {
        throw new BadRequestException('AI returned empty or unreadable data');
      }

      console.log(' [AI Extraction Success]:', certificateObj);
const isFailedExtraction = 
        (!certificateObj.certificate_name || String(certificateObj.certificate_name).trim().toLowerCase() === 'null') &&
        (!certificateObj.provider || String(certificateObj.provider).trim().toLowerCase() === 'null') &&
        (!certificateObj.date_of_obtention || String(certificateObj.date_of_obtention).trim().toLowerCase() === 'null');

      if (isFailedExtraction) {
        console.warn(` [Parser-Orchestrator]: Extraction failed for file ${file.originalname}. Document is invalid or empty.`);
        throw new BadRequestException('Extraction failed: The document does not contain valid certificate data.');
      }
      // 3. Post-processing : Standardisation stricte des dates (Format YYYY-MM-DD)
      const standardizedIssueDate = this.formatDateToISO(certificateObj.date_of_obtention);
      const standardizedExpiryDate = this.formatDateToISO(certificateObj.date_of_expiration);
      // 3. Mapping technique & Calcul du statut de validité
      const status = this.calculateStatus(certificateObj.date_of_expiration);

      // 4. Délégation de la sauvegarde au service de Domaine métier
      const savedCert = await this.certsService.create(employeeId, {
        name: certificateObj.certificate_name,
        issuer: certificateObj.provider,
       issueDate: certificateObj.date_of_obtention, // Injecté comme string propre "YYYY-MM-DD"
        expirationDate: certificateObj.date_of_expiration, // Injecté comme string propre ou null credentialId: certificateObj.credential_id || null,
        status: status as 'active' | 'expired' | 'expiring_soon',
        filePath: filePath,
      });

      return savedCert;
    } catch (error) {
      console.error(' [Parser-Orchestrator Error]:', error.message);
      throw error;
    }
  }
*/
  /**
   * Règle de gestion isolée : Détermine l'état de validité de la certification
   */