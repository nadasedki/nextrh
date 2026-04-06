import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { TrainingService } from '../training/training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYEE')
@Controller('trainings')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post()
  async createTraining(@Req() req, @Body() createDto: CreateTrainingDto) {
    // 1. DEBUG: Print to terminal to see what req.user actually contains
    console.log('🚨 TRAINING DEBUG - req.user:', req.user);

    // 2. Robustly find the User ID (matches working certification logic)
    const userId = req.user?.userId || req.user?.sub || req.user?.id || req.user?.user_id;

    if (!userId) {
      throw new Error('User ID is missing from JWT token!');
    }

    // 3. Pass the userId to the service
    return this.trainingService.create(userId, createDto);
  }

 @Get('me')
  async findMine(@Req() req) {
    // 1. DEBUG: Log the request to see if it even hits the controller
    console.log('🚨 GET /trainings/me - Request received');                

    const userId = req.user?.userId || req.user?.sub || req.user?.id || req.user?.user_id;
    console.log('🚨 GET /trainings/me - Found UserId:', userId);

    if (!userId) {
      throw new Error('User ID is missing from JWT token!');
    }

    return this.trainingService.findByUser(userId);
  }
}