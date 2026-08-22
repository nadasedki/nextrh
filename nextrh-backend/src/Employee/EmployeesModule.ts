import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

// Entities
import { User } from '../users/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Training } from '../training/entities/training.entity';
import { Certification } from '../certifications/entities/certification.entity';
import { Cv } from '../cvs/entities/cv.entity';
import { Team } from 'src/teams/entities/team.entity';
import { Education } from 'src/education/entities/education.entity';
import { ProjectModule } from 'src/project/project.module';
import { TrainingModule } from 'src/training/training.module';
import { EducationModule } from 'src/education/education.module';
import { CertificationsModule } from 'src/certifications/certifications.module';
// If you have a shared AuthModule, import it here for guards
// import { AuthModule } from '../auth/auth.module';
import { Experience } from 'src/experience/entities/experience.entity';
import { CvModule } from 'src/cvs/cv.module';
import { EmployeeProfileService } from './employeeProfile.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Project,
      Training,
      Certification,
      Cv,
      Team,
      Education,
      Experience,
    ]),
  
  ],
  
  controllers: [EmployeesController],
  providers: [EmployeesService,EmployeeProfileService],
  exports: [EmployeeProfileService], 
})
export class EmployeesModule {}