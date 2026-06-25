// src/project/project.module.ts (or wherever it lives)
import { Module } from '@nestjs/common';
import { TrainingModule } from '../training/training.module';
import { ProjectsController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ScoringModule } from 'src/scoring/scoring.module';
// import { CertificationModule } from '../certifications/certification.module';

@Module({
  imports: [
    TrainingModule,
 TypeOrmModule.forFeature([Project]),
 ScoringModule
  ],
  controllers: [ProjectsController],
  providers:  [ProjectService],
  exports: [ProjectService], 
})
export class ProjectModule {}