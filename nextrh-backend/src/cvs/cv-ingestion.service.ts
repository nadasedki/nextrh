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

@Injectable()
export class CvIngestionService {
  private readonly logger = new Logger(CvIngestionService.name);

  constructor(
    private readonly cvService: CvService,
    private readonly educationService: EducationService,
    private readonly certificationsService: CertificationsService,
    private readonly projectsService: ProjectService,
    private readonly usersService: UsersService,
    private readonly experienceService: ExperienceService,
    private readonly scoringService: ScoringService,
    private readonly cvExtractionOrchestrator: CvExtractionOrchestrator,
    private readonly eventEmitter: EventEmitter2, 
  ) {}


  async ingestCv(
    fileBuffer: Buffer,
    employeeId: number,
    originalName: string,
    savedFilePath: string, //  Receives the already-persisted file path
  ) {
    this.logger.log(`[Worker Pipeline] Starting AI extraction for Employee #${employeeId}...`);

    // 1. Run AI Extraction via Orchestrator
    const parseResult = await this.cvExtractionOrchestrator.parseCv(fileBuffer);
    const result = parseResult.data;

    // 2. Clean up previous CV and its records if one already exists
    const existingCv = await this.cvService.findByUserId(employeeId);
    if (existingCv) {
      this.logger.log(`Replacing previous CV #${existingCv.cv_id} for Employee #${employeeId}`);
      await this.cvService.remove(existingCv.cv_id, employeeId);
    }

    // 3. Save extracted identity details to PostgreSQL 'cvs' table
    this.logger.log(`Persisting extracted identity details to database...`);
    const savedCv = await this.cvService.saveIdentityCv(employeeId, savedFilePath, result);

    // Update main user profile
    await this.usersService.updateProfileFromCv(employeeId, savedCv.full_name, savedCv.profession);
    
    // 4. Populate relational child tables in parallel/sequence
    await this.educationService.createParsedEducation(result.education, employeeId, savedCv);
    await this.certificationsService.createBulkFromParsedData(result.certifications, employeeId, savedFilePath, savedCv);
    await this.projectsService.createBulkFromParsedData(result.projects, employeeId, savedCv);
    await this.experienceService.createBulkFromParsedData(result.experience, employeeId, savedCv);

    // 5. Calculate experience & scoring metrics
    const years = await this.experienceService.calculateTotalExperience(employeeId);
    await this.usersService.updateYearsOfExperience(employeeId, years);
    
    this.logger.log(`Re-calculating scoring match vectors for User #${employeeId}...`);
    await this.scoringService.calculateAndSaveScore(employeeId);

    // 6. Emit event for async Qdrant Vector Indexing
    this.eventEmitter.emit('cv.saved', {
      entityId: savedCv.cv_id,
      userId: employeeId,
    });

    this.logger.log(`[Worker Pipeline] CV #${savedCv.cv_id} successfully parsed and indexed!`);

    return {
      status: 'success',
      cvId: savedCv.cv_id,
      filePath: savedFilePath,
      metrics: parseResult.execution_metrics,
      data: result,
    };
  }
}