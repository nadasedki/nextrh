import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TextSegmentationService } from './services/text-segmentation.service';
import { ContactInfoExtractorService } from './services/contact-info-extractor.service';
import { SkillsExtractorService } from './services/skills-extractor.service';
import { CertificationExtractorService } from './services/certification-extractor.service';
import { EducationExtractorService } from './services/education-extractor.service';
import { ProjectExtractorService } from './services/project-extractor.service';
import { ExperienceExtractorService } from './services/experience-extractor.service';
import { LlmFallbackService } from './services/llm-fallback.service';
import { CvHeuristicextractionService } from './cv-heuristic-extraction.service';
import { CvExtractionOrchestrator } from './cv-extraction-orchestrator.service';
import { PdfParserService } from './services/pdf-parser.service';
import { CvParserController } from './cv-parser.controller';
import { CvEvaluationService } from './services/cv-evaluation.service';
import { CvMultimodalParserService } from './cv-multimodal-parser.service';
@Module({
  imports: [ConfigModule],
  providers: [
    TextSegmentationService,
    ContactInfoExtractorService,
    SkillsExtractorService,
    CertificationExtractorService,
    EducationExtractorService,
    ProjectExtractorService,
    ExperienceExtractorService,
    LlmFallbackService,
    CvHeuristicextractionService,
    CvExtractionOrchestrator, 
    PdfParserService,
    CvEvaluationService,
    CvMultimodalParserService
  ],
  controllers: [CvParserController],
  exports: [CvExtractionOrchestrator], 
})
export class CvParserModule {}