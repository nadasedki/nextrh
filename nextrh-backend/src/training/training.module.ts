// src/project_training/training.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingController } from './training.controller';
import { TrainingService } from '../training/training.service';
import { Training } from './entities/training.entity';
import { UsersModule } from '../users/users.module';
import { ScoringModule } from 'src/scoring/scoring.module';
@Module({
  imports: [
    // This allows the service to use the database repository
    TypeOrmModule.forFeature([Training]),UsersModule,ScoringModule
  ],
  controllers: [TrainingController], // This registers your controller routes
  providers: [TrainingService],      // This makes the service injectable
})
export class TrainingModule {}