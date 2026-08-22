// src/training/training.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Training } from './entities/training.entity';
import { CreateTrainingDto } from './dto/create-training.dto';
import { User } from '../users/entities/user.entity';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { ScoringService } from 'src/scoring/scoring.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; // 1. Import EventEmitter2

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(Training)
    private trainingRepository: Repository<Training>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly scoringService: ScoringService, 
    private readonly eventEmitter: EventEmitter2, // 2. Inject EventEmitter2 in constructor
  ) {}

  async create(userId: number, createDto: CreateTrainingDto) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }  
    
    const training = this.trainingRepository.create({
      ...createDto,
      user_id: userId,
    });

    const savedTraining = await this.trainingRepository.save(training);

    // MISE À JOUR DU SCORE ICI
    await this.scoringService.calculateAndSaveScore(userId);

    // 3. Emit training.saved event on creation [1]
    this.eventEmitter.emit('training.saved', {
      entityId: savedTraining.training_id,
      userId,
    });

    return savedTraining;
  }

  async findByUser(userId: number) {
    return this.trainingRepository.find({
      where: { user: { user_id: userId } },
    });
  }

  async update(
    userId: number,
    trainingId: number,
    updateDto: UpdateTrainingDto,
  ) {
    const training = await this.trainingRepository.findOne({
      where: {
        training_id: trainingId,
        user_id: userId,
      },
    });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    Object.assign(training, updateDto);
    const savedTraining = await this.trainingRepository.save(training);

    // 4. Emit training.saved event on update [1]
    this.eventEmitter.emit('training.saved', {
      entityId: trainingId,
      userId,
    });

    return savedTraining;
  }

  async remove(userId: number, trainingId: number) {
    const training = await this.trainingRepository.findOne({
      where: {
        training_id: trainingId,
        user_id: userId,
      },
    });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    await this.trainingRepository.remove(training);

    // MISE À JOUR DU SCORE ICI
    await this.scoringService.calculateAndSaveScore(userId);

    // 5. Emit training.deleted event on removal [1]
    this.eventEmitter.emit('training.deleted', {
      entityId: trainingId,
      userId,
    });

    return {
      message: 'Training deleted successfully',
    };
  }
}