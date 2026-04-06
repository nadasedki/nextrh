import { Module } from '@nestjs/common';
import { CvParsingService } from './cv-parsing.service';
import { CvParsingController } from './cv-parsing.controller';
import { PdfExtractorService } from './pdf-extractor/pdf-extractor.service';
import { HeuristicParserService } from './heuristic-parser/heuristic-parser.service';
import { LlmService } from './llm/llm.service';
import { CvModule } from 'src/cvs/cv.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cv } from 'src/cvs/entities/cv.entity';
import { Education } from 'src/education/entities/education.entity';
import { EducationModule } from 'src/education/education.module';
import { CertificationsModule } from 'src/certifications/certifications.module';
import { Project } from 'src/project/entities/project.entity';
import { ProjectModule } from 'src/project/project.module';
import { ExperienceModule } from 'src/experience/experience.module';
import { Experience } from 'src/experience/entities/experience.entity';
@Module({

  imports: [TypeOrmModule.forFeature([Cv]),CvModule,EducationModule,TypeOrmModule.forFeature([Education]),
  CertificationsModule,ProjectModule,TypeOrmModule.forFeature([Project]),
  ExperienceModule,TypeOrmModule.forFeature([Experience])],
  providers: [CvParsingService, PdfExtractorService, HeuristicParserService, LlmService],
  controllers: [CvParsingController]
})
export class CvParsingModule {}
