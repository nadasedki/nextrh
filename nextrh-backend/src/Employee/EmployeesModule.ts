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
import { UserSkill } from 'src/skill/entities/user-skill.entity';
import { Team } from 'src/users/entities/team.entity';
import { Education } from 'src/education/entities/education.entity';

// If you have a shared AuthModule, import it here for guards
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Project,
      Training,
      Certification,
      Cv,
      UserSkill,
      Team,Education
    ]),
    // AuthModule, // Import if you need shared authentication logic
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService], // Export if other modules need to use this service
})
export class EmployeesModule {}