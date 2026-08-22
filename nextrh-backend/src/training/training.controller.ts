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

  /**
   * 1. GET MY OWN TRAININGS (Employee Space - Unchanged)
   * GET /trainings/me
   */
  @Get('me')
  @Roles('EMPLOYEE') // Restricted strictly to Employees
  async findMine(@Req() req) {
    console.log('🚨 GET /trainings/me - Request received');                
    const userId = req.user?.userId;
    console.log('🚨 GET /trainings/me - Found UserId:', userId);

    if (!userId) {
      throw new Error('User ID is missing from JWT token!');
    }
    return this.trainingService.findByUser(userId);
  }

  /**
   * 2. GET TRAININGS OF A SPECIFIC EMPLOYEE (Team Leader Space)
   * GET /trainings/employee/:userId
   */
  @Get('employee/:userId')
  @Roles('MANAGER', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
  async findEmployeeTrainings(@Param('userId', ParseIntPipe) userId: number) {
    return this.trainingService.findByUser(userId);
  }

  /**
   * 3. ASSIGN TRAINING TO EMPLOYEE (Team Leader Space)
   * POST /trainings/:userId
   */
  @Post(':userId')
  @Roles('MANAGER', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
  async createTraining(
    @Param('userId', ParseIntPipe) userId: number, 
    @Body() createDto: CreateTrainingDto
  ) {
    return this.trainingService.create(userId, createDto);
  }

  /**
   * 4. UPDATE ASSIGNED TRAINING (Team Leader Space)
   * PATCH /trainings/:id/:userId
   */
  @Patch(':id/:userId')
  @Roles('MANAGER', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
  async updateTraining(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateTrainingDto,
  ) {
    return this.trainingService.update(userId, id, updateDto);
  }

  /**
   * 5. UNASSIGN/DELETE TRAINING (Team Leader Space)
   * DELETE /trainings/:id/:userId
   */
  @Delete(':id/:userId')
  @Roles('MANAGER', 'TEAM_LEADER', 'BID_MANAGER', 'ADMIN')
  async deleteTraining(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.trainingService.remove(userId, id);
  }
}
/*import { Controller, Post, Body, UseGuards, Req, Get, Delete, ParseIntPipe, Param, Patch } from '@nestjs/common';
import { TrainingService } from '../training/training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateTrainingDto } from './dto/update-training.dto';

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
    const userId = req.user?.userId;

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

    const userId = req.user?.userId;
    console.log('🚨 GET /trainings/me - Found UserId:', userId);

    if (!userId) {
      throw new Error('User ID is missing from JWT token!');
    }

    return this.trainingService.findByUser(userId);
  }

  @Patch(':id')
  async updateTraining(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTrainingDto,
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new Error('User ID is missing from JWT token!');
    }

    return this.trainingService.update(userId, id, updateDto);
  }

  @Delete(':id')
  async deleteTraining(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new Error('User ID is missing from JWT token!');
    }

    return this.trainingService.remove(userId, id);
  }
}*/