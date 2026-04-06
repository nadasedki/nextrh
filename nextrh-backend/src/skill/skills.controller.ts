import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  async getAllSkills() {
    return await this.skillsService.findAllSkills();
  }

  @Post('add-to-me')
  async addSkillToMe(
    @Req() req,
    @Body('skillName') skillName: string,
    @Body('level') level: string,
  ) {
    const userId = req.user.userId;
    return await this.skillsService.addSkillToUser(userId, skillName, level);
  }
}