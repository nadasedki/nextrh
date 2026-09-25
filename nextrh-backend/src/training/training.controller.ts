import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  Get, 
  Delete, 
  ParseIntPipe, 
  Param, 
  Patch 
} from '@nestjs/common';
import { TrainingService } from '../training/training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateTrainingDto } from './dto/update-training.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainings')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

 
  @Get('me')
  @Roles('EMPLOYEE') 
  async findMine(@Req() req) {
    console.log(' GET /trainings/me - Request received');                
    const userId = req.user?.userId;
    console.log(' GET /trainings/me - Found UserId:', userId);

    if (!userId) {
      throw new Error('User ID is missing from JWT token!');
    }
    return this.trainingService.findByUser(userId);
  }

 
  @Get('employee/:userId')
  @Roles('MANAGER', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
  async findEmployeeTrainings(@Param('userId', ParseIntPipe) userId: number) {
    return this.trainingService.findByUser(userId);
  }

  
  @Post(':userId')
  @Roles('MANAGER', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
  async createTraining(
    @Param('userId', ParseIntPipe) userId: number, 
    @Body() createDto: CreateTrainingDto
  ) {
    return this.trainingService.create(userId, createDto);
  }

  
  @Patch(':id/:userId')
  @Roles('MANAGER', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
  async updateTraining(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateTrainingDto,
  ) {
    return this.trainingService.update(userId, id, updateDto);
  }

  
  @Delete(':id/:userId')
  @Roles('MANAGER', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
  async deleteTraining(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.trainingService.remove(userId, id);
  }
}
