import { Injectable, Logger } from '@nestjs/common';
import { TextSegmentationService } from './services/text-segmentation.service';
import { ContactInfoExtractorService } from './services/contact-info-extractor.service';
import { SkillsExtractorService } from './services/skills-extractor.service';
import { CertificationExtractorService } from './services/certification-extractor.service';
import { EducationExtractorService } from './services/education-extractor.service';
import { ProjectExtractorService } from './services/project-extractor.service';
import { ExperienceExtractorService } from './services/experience-extractor.service';
import { cleanRawText } from './utils/text-cleaning.util';
import { ParsedCv } from './interfaces/cv-extraction.types';

@Injectable()
export class CvHeuristicextractionService {
  private readonly logger = new Logger(CvHeuristicextractionService.name);

  constructor(
    private readonly segmentationService: TextSegmentationService,
    private readonly contactExtractor: ContactInfoExtractorService,
    private readonly skillsExtractor: SkillsExtractorService,
    private readonly certExtractor: CertificationExtractorService,
    private readonly eduExtractor: EducationExtractorService,
    private readonly projectExtractor: ProjectExtractorService,
    private readonly expExtractor: ExperienceExtractorService,
  ) {}

  public parse(rawText: string, cvId = 0, userId = 0, filePath = ''): ParsedCv {
    this.logger.log('Starting modular heuristic parsing pass...');

    const cleanedText = cleanRawText(rawText);
    const sections = this.segmentationService.segmentText(cleanedText);
    const contactInfo = this.contactExtractor.extract(cleanedText);

    return {
      cv_id: cvId,
      user_id: userId,
      file_path: filePath,
      format: 'pdf',
      generated: true,
      last_updated: new Date(),
      full_name: contactInfo.fullName,
      profession: contactInfo.profession,
      email: contactInfo.email,
      phone: phoneFormattingFallback(contactInfo.phone),
      fax: contactInfo.fax,
      address: contactInfo.address,
      skills: this.skillsExtractor.extract(sections.skills ?? '',''),//cleanedText
      certifications: this.certExtractor.extract(sections.certification ?? ''),
      education: this.eduExtractor.extract(sections.education ?? ''),
      projects: this.projectExtractor.extract(sections.projects ?? ''),
      experiences: this.expExtractor.extract(sections.experience ?? ''),
    };
  }
}

function phoneFormattingFallback(phone: string): string {
  return phone.replace(/\s+/g, ' ').trim();
}