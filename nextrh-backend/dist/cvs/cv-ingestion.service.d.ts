import { CvExtractionOrchestrator } from 'src/cv-parser/cv-extraction-orchestrator.service';
import { CvService } from 'src/cvs/cv.service';
import { EducationService } from 'src/education/education.service';
import { CertificationsService } from 'src/certifications/services/certifications.service';
import { ProjectService } from 'src/project/project.service';
import { ExperienceService } from 'src/experience/experience.service';
import { UsersService } from 'src/users/users.service';
import { ScoringService } from 'src/scoring/scoring.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class CvIngestionService {
    private readonly cvService;
    private readonly educationService;
    private readonly certificationsService;
    private readonly projectsService;
    private readonly usersService;
    private readonly experienceService;
    private readonly scoringService;
    private readonly cvExtractionOrchestrator;
    private readonly eventEmitter;
    private readonly logger;
    constructor(cvService: CvService, educationService: EducationService, certificationsService: CertificationsService, projectsService: ProjectService, usersService: UsersService, experienceService: ExperienceService, scoringService: ScoringService, cvExtractionOrchestrator: CvExtractionOrchestrator, eventEmitter: EventEmitter2);
    ingestCv(fileBuffer: Buffer, employeeId: number, originalName: string, savedFilePath: string): Promise<{
        status: string;
        cvId: number;
        filePath: string;
        metrics: {
            total_time_ms: number;
            heuristic_time_ms: number;
            llm_inference_ms: number;
            fallback_triggered: boolean;
            character_count: number;
        };
        data: {
            profile: {
                name: string;
                profession: string;
                phone: string;
                fax: string;
                email: string;
                address: string;
                skills: string[];
            };
            experience: Array<{
                period: string;
                company: string;
                role: string;
                lowConfidence?: boolean;
            }>;
            certifications: Array<{
                certName: string;
                date: string | null;
                lowConfidence?: boolean;
            }>;
            education: Array<{
                year: string;
                institution: string;
                degree: string;
                lowConfidence?: boolean;
            }>;
            projects: Array<{
                year: string | null;
                client: string;
                description: string;
                lowConfidence?: boolean;
            }>;
        };
    }>;
}
