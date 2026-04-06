import { PdfExtractorService } from './pdf-extractor/pdf-extractor.service';
import { HeuristicParserService } from './heuristic-parser/heuristic-parser.service';
import { LlmService } from 'src/cv-parsing/llm/llm.service';
import { CvService } from 'src/cvs/cv.service';
import { EducationService } from 'src/education/education.service';
import { CertificationsService } from 'src/certifications/certifications.service';
import { ProjectService } from 'src/project/project.service';
import { ExperienceService } from 'src/experience/experience.service';
export declare class CvParsingService {
    private pdfExtractor;
    private heuristicParser;
    private llmService;
    private cvService;
    private educationService;
    private certificationsService;
    private projectsService;
    private experienceService;
    private readonly logger;
    constructor(pdfExtractor: PdfExtractorService, heuristicParser: HeuristicParserService, llmService: LlmService, cvService: CvService, educationService: EducationService, certificationsService: CertificationsService, projectsService: ProjectService, experienceService: ExperienceService);
    processPdf(pdfPath: string, employeeId: number): Promise<{
        contact: {
            name: string;
            profession: string;
            phone: string;
            fax: string;
            email: string;
            address: string;
        };
        experience: any[];
        certifications: any[];
        education: any[];
        projects: any[];
        skills: any[];
    }>;
    extractTextFromPdf(pdfPath: string): Promise<string>;
    parseEntireCv(rawText: string): Promise<{
        contact: {
            name: string;
            profession: string;
            phone: string;
            fax: string;
            email: string;
            address: string;
        };
        experience: any[];
        certifications: any[];
        education: any[];
        projects: any[];
        skills: any[];
    }>;
    private splitSections;
    private isSectionInvalid;
}
