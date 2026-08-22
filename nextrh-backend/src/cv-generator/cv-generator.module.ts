import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Make sure TypeORM is imported if your schema dictates it
import { CvGeneratorController } from './cv-generator.controller';
import { PdfGeneratorService } from './pdf-generator.service';

import { EmployeeProfileService } from 'src/Employee/employeeProfile.service';
import { CvTemplateService } from './cv-template.service';
import { CvDataFormatterService } from './cv-data-formatter.service';


@Module({
  imports: [
    // Include this if TypeORM connection config is managed globally
    // TypeOrmModule.forFeature([])
  ],
  controllers: [CvGeneratorController],
  providers: [
    
    PdfGeneratorService,
    CvTemplateService,
    CvDataFormatterService,
    EmployeeProfileService, 
  ],
})
export class CvGeneratorModule {}