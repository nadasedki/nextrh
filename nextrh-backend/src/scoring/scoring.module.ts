import { Module } from '@nestjs/common';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { User } from '../users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from 'src/project/entities/project.entity';
import { Training } from 'src/training/entities/training.entity';
import { Certification } from 'src/certifications/entities/certification.entity'; 
@Module({
  imports: [TypeOrmModule.forFeature([User, Project, Training, Certification]),],
  controllers: [ScoringController],
  providers: [ScoringService],
   exports: [ScoringService],

})
export class ScoringModule {}
