// src/cv-generator/cv-generator.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CvTemplate } from './entities/cv-template.entity';
import { CvGeneratorController } from './cv-generator.controller';
import { CvTemplateService } from './services/cv-template.service';
import { CvTemplateIngestionService } from './services/cv-template-ingestion.service';
import { CvGeneratorService } from './services/cv-generator.service';
import { CvDataFormatterService } from './services/cv-data-formatter.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { TemplateIngestionProcessor } from './processors/template-ingestion.processor';
import { CvGenerationProcessor } from './processors/cv-generation.processor';
import { LlmModule } from '../llm/llm.module';
//import { EmployeeProfileService } from 'src/Employee/employeeProfile.service'
import { EmployeesModule } from 'src/Employee/EmployeesModule';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
@Module({
  imports: [
    TypeOrmModule.forFeature([CvTemplate]),
    BullModule.registerQueue(
      { name: 'template-ingestion' },
      { name: 'cv-generation' },
    ),BullBoardModule.forFeature(
      { name: 'template-ingestion', adapter: BullMQAdapter },
      { name: 'cv-generation', adapter: BullMQAdapter },
    ),
    LlmModule,
    EmployeesModule, 
  ],
  controllers: [CvGeneratorController],
  providers: [
    CvTemplateService,
    CvTemplateIngestionService,
    CvGeneratorService,
    CvDataFormatterService,
    PdfGeneratorService,
    TemplateIngestionProcessor,
    CvGenerationProcessor,
  ],
  exports: [CvTemplateService, CvGeneratorService],
})
export class CvGeneratorModule {}