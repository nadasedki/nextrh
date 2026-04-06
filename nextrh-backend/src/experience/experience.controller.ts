import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path based on your project

@Controller('experiences') // 1. Change to plural to match Frontend
@UseGuards(JwtAuthGuard)    // 2. Protect the route to get user ID
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Post()
  create(@Request() req, @Body() createExperienceDto: CreateExperienceDto) {
    // 3. Extract user_id from the JWT token
    return this.experienceService.create({ 
        ...createExperienceDto, 
        user_id: req.user.userId || req.user.id 
    });
  }

  @Get('me') // 4. Add this missing route
  async findMyExperiences(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return this.experienceService.findByUser(userId);
  }
}