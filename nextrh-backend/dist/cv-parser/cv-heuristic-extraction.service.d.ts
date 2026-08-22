import { TextSegmentationService } from './services/text-segmentation.service';
import { ContactInfoExtractorService } from './services/contact-info-extractor.service';
import { SkillsExtractorService } from './services/skills-extractor.service';
import { CertificationExtractorService } from './services/certification-extractor.service';
import { EducationExtractorService } from './services/education-extractor.service';
import { ProjectExtractorService } from './services/project-extractor.service';
import { ExperienceExtractorService } from './services/experience-extractor.service';
import { ParsedCv } from './interfaces/cv-extraction.types';
export declare class CvHeuristicextractionService {
    private readonly segmentationService;
    private readonly contactExtractor;
    private readonly skillsExtractor;
    private readonly certExtractor;
    private readonly eduExtractor;
    private readonly projectExtractor;
    private readonly expExtractor;
    private readonly logger;
    constructor(segmentationService: TextSegmentationService, contactExtractor: ContactInfoExtractorService, skillsExtractor: SkillsExtractorService, certExtractor: CertificationExtractorService, eduExtractor: EducationExtractorService, projectExtractor: ProjectExtractorService, expExtractor: ExperienceExtractorService);
    parse(rawText: string, cvId?: number, userId?: number, filePath?: string): ParsedCv;
}
