import { Controller, Get, Post, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('scoring')
@UseGuards(JwtAuthGuard) 
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  
  @Post('recalculate/:userId')
  async recalculateUserScore(@Param('userId', ParseIntPipe) userId: number) {
    const newScore = await this.scoringService.calculateAndSaveScore(userId);
    return {
      message: 'Score mis à jour avec succès',
      userId: userId,
      score: newScore,
    };
  }

 
  @Get('user/:userId')
  async getUserScore(@Param('userId', ParseIntPipe) userId: number) {
    const score = await this.scoringService.getUserScore(userId);
    return {
      userId: userId,
      score: score,
    };
  }

  
  @Get('leaderboard')
  //@UseGuards(RolesGuard)
  //@Roles('manager') 
  async getAllScores() {
    return await this.scoringService.getLeaderboard();
  }
}