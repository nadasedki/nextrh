import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cv } from './entities/cv.entity';
import { EducationModule } from '../education/education.module';
import { CvImportService } from './cv-import/cv-import.service';
import { CvParserModule } from 'src/cv-parser/cv-parser.module';
import { CertificationsModule } from 'src/certifications/certifications.module';
import { ProjectModule } from 'src/project/project.module';
import { UsersModule } from 'src/users/users.module';
import { ExperienceModule } from 'src/experience/experience.module';
import { ScoringModule } from 'src/scoring/scoring.module';


@Module({
   imports: [
    TypeOrmModule.forFeature([Cv]),
    EducationModule,
    CertificationsModule, 
    ProjectModule,
    UsersModule,
    ExperienceModule,
    ScoringModule,
    CvParserModule
  ],
  controllers: [CvController],
  providers: [CvService, CvImportService],
  exports: [CvService],
})
export class CvModule {}
