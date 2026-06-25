
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Training } from './entities/training.entity';
import { CreateTrainingDto } from './dto/create-training.dto';
import { User } from '../users/entities/user.entity';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { ScoringService } from 'src/scoring/scoring.service';
@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(Training)
    private trainingRepository: Repository<Training>,
    @InjectRepository(User)
    private userRepository: Repository<User>,

  private readonly scoringService: ScoringService, 
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

   
     await this.trainingRepository.save(training);

      // MISE À JOUR DU SCORE ICI
  await this.scoringService.calculateAndSaveScore(userId);
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

  return await this.trainingRepository.save(training);
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
  return {
    message: 'Training deleted successfully',
  };
}
}