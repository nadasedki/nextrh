// src/project_training/training.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Training } from './entities/training.entity';
import { CreateTrainingDto } from './dto/create-training.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(Training)
    private trainingRepository: Repository<Training>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

   
    return await this.trainingRepository.save(training);
  }

  async findByUser(userId: number) {
    return this.trainingRepository.find({
      where: { user: { user_id: userId } },
     
    });
  }
}