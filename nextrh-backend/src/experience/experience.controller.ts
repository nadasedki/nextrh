import { Controller, Get, Post, Body, UseGuards, Request, Patch, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path based on your project

@Controller('experiences') 
@UseGuards(JwtAuthGuard)    
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Post()
  create(@Request() req, @Body() createExperienceDto: CreateExperienceDto) {
    
    return this.experienceService.create({ 
        ...createExperienceDto, 
        user_id: req.user.userId || req.user.id 
    });
  }

  @Get('me') 
  async findMyExperiences(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return this.experienceService.findByUser(userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateDto: any
  ) {
    const userId = req.user.userId || req.user.id;
    return this.experienceService.update(id, userId, updateDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    const userId = req.user.userId || req.user.id;
    return this.experienceService.remove(id, userId);
  }
}