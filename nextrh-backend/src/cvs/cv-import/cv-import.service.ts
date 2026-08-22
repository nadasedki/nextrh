import { Injectable, Logger } from '@nestjs/common';
import { CvExtractionOrchestrator } from 'src/cv-parser/cv-extraction-orchestrator.service';
import { CvService } from 'src/cvs/cv.service';
import { EducationService } from 'src/education/education.service';
import { CertificationsService } from 'src/certifications/services/certifications.service';
import { ProjectService } from 'src/project/project.service';
import { ExperienceService } from 'src/experience/experience.service';
import { UsersService } from 'src/users/users.service';
import { ScoringService } from 'src/scoring/scoring.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; 
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
@Injectable()
export class CvImportService {
 
private readonly uploadDir: string;



  private readonly logger = new Logger(CvImportService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cvService: CvService,
    private readonly educationService: EducationService,
    private readonly certificationsService: CertificationsService,
    private readonly projectsService: ProjectService,
    private readonly usersService: UsersService,
    private readonly experienceService: ExperienceService,
    private readonly scoringService: ScoringService,
    private readonly cvExtractionOrchestrator: CvExtractionOrchestrator,
    private readonly eventEmitter: EventEmitter2, 
  ) {
     const configuredPath = this.configService.get<string>('UPLOAD_DESTINATION') || './uploads/cvs';
    
   
    this.uploadDir = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);

    this.logger.log(`CV Upload directory initialized at: ${this.uploadDir}`);
  }
private async saveFileToDisk(fileBuffer: Buffer, employeeId: number, originalName: string): Promise<string> {
  await fs.mkdir(this.uploadDir, { recursive: true });
  const ext = path.extname(originalName) || '.pdf';
  const fileName = `cv-${employeeId}-${Date.now()}${ext}`;
  const fullPath = path.join(this.uploadDir, fileName);
  await fs.writeFile(fullPath, fileBuffer);
  return `uploads/cvs/${fileName}`;
}
  /**
   * Orchestrates the parsing extraction and database storage sequence.
   */
  async uploadAndSaveCv(fileBuffer: Buffer, employeeId: number, originalName: string) {
    this.logger.log(` Starting execution pipeline for employee ID: ${employeeId}`);

    // 1. Get the pure, clean JSON data from your Facade (No DB interactions inside)
    //const parseResult = await this.cvParserFacade.parseCv(fileBuffer);
    const parseResult = await this.cvExtractionOrchestrator.parseCv(fileBuffer);
   
    const result = parseResult.data;
 // If an existing CV exists for this employee, perform a clean cascading wipe first 
    const existingCv = await this.cvService.findByUserId(employeeId);
    if (existingCv) {
      this.logger.log(`Existing CV found (ID: ${existingCv.cv_id}) for employee ${employeeId}. Deleting old profile records...`);
      await this.cvService.remove(existingCv.cv_id, employeeId); 
    }
    // 2. Database saving logic sequentially executed here
    this.logger.log(` Saving extracted identity details to database...`);
    //const savedCv = await this.cvService.saveIdentityCv(employeeId, originalName, result);
const savedFilePath = await this.saveFileToDisk(fileBuffer, employeeId, originalName);
const savedCv = await this.cvService.saveIdentityCv(employeeId, savedFilePath, result);
    await this.usersService.updateProfileFromCv(employeeId, savedCv.full_name, savedCv.profession);
    
    // 3. Populate all related relational tables
    await this.educationService.createParsedEducation(result.education, employeeId, savedCv);
    await this.certificationsService.createBulkFromParsedData(result.certifications, employeeId, savedFilePath, savedCv);
    await this.projectsService.createBulkFromParsedData(result.projects, employeeId, savedCv);
    await this.experienceService.createBulkFromParsedData(result.experience, employeeId, savedCv);

    // 4. Calculate post-import analytics and scoring metrics
    const years = await this.experienceService.calculateTotalExperience(employeeId);
    await this.usersService.updateYearsOfExperience(employeeId, years);
    
    this.logger.log(` Re-calculating scoring match vectors...`);
    await this.scoringService.calculateAndSaveScore(employeeId);

        this.eventEmitter.emit('cv.saved', {
      entityId: savedCv.cv_id,
      userId: employeeId,
    });

    this.logger.log(` Event 'cv.saved' dispatched successfully. Background indexing started.`);

    // Return the clean result back to the controller
    return {
      status: 'success',
      cvId: savedCv.cv_id,
      metrics: parseResult.execution_metrics,
      data: result
    };
  }
}