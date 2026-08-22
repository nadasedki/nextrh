// src/teams/teams.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Param, 
  ParseIntPipe,
  Delete
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

// Custom lightweight inline decorator to safely retrieve user from Request
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER')
  @Post('members')
  async addMember(@CurrentUser() user: any, @Body() dto: InviteMemberDto) {
    return this.teamsService.addMemberByEmail(user.userId, dto.email); // Safe userId passing
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER')
  @Get('my-team')
  async getMyTeam(@CurrentUser() user: any) {
    return this.teamsService.getMyTeam(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER')
  @Delete('members/:id') 
  async removeMember(@CurrentUser() user: any, @Param('id', ParseIntPipe) memberId: number) {
    return this.teamsService.removeMemberFromLeaderTeam(user.userId, memberId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER')
  @Get('my-team/members')
  async getMyTeamMembers(@CurrentUser() user: any) {
    return this.teamsService.findMembersByManager(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER')
  @Get('my-team/stats')
  async getMyTeamStats(@CurrentUser() user: any) {
    return this.teamsService.calculateTeamStats(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER')
  @Get('my-team/certifications')
  async getMyTeamCertifications(@CurrentUser() user: any) {
    return this.teamsService.findAllTeamCertifications(user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }
}