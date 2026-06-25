import { CvParserFacade } from 'src/document-manager/services/cv-parser.facade';
import { CvService } from 'src/cvs/cv.service';
import { EducationService } from 'src/education/education.service';
import { CertificationsService } from 'src/certifications/services/certifications.service';
import { ProjectService } from 'src/project/project.service';
import { ExperienceService } from 'src/experience/experience.service';
import { UsersService } from 'src/users/users.service';
import { ScoringService } from 'src/scoring/scoring.service';
export declare class CvImportService {
    private readonly cvParserFacade;
    private readonly cvService;
    private readonly educationService;
    private readonly certificationsService;
    private readonly projectsService;
    private readonly usersService;
    private readonly experienceService;
    private readonly scoringService;
    private readonly logger;
    constructor(cvParserFacade: CvParserFacade, cvService: CvService, educationService: EducationService, certificationsService: CertificationsService, projectsService: ProjectService, usersService: UsersService, experienceService: ExperienceService, scoringService: ScoringService);
    uploadAndSaveCv(fileBuffer: Buffer, employeeId: number, originalName: string): Promise<{
        status: string;
        cvId: number;
        metrics: any;
        data: any;
    }>;
}
