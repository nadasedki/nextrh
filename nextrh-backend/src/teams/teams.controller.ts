import { Controller, Post, Body, Get, UseGuards ,Req } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from 'src/teams/dto/add-member.dto';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Param, ParseIntPipe } from '@nestjs/common';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}
 // POST /teams
  @Post()
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }
 // POST /teams
  @Get()
  findAll() {
    return this.teamsService.findAll();
  }
  /*@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER')
  @Post('add-member')
  addMember(@Body() dto: AddMemberDto) {
    return this.teamsService.addMember(dto);
  }*/
 

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEAM_LEADER')
@Post('members') // matches your frontend fetch path
async addMember(@Req() req: any, @Body('email') email: string) {
  const leaderId = req.user.sub;
  return this.teamsService.addMemberByEmail(leaderId, email);
}
  
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEAM_LEADER')
@Get('my-team')
async getMyTeam(@Req() req: any) {  // <-- use any here
  const leaderId = req.user.sub; // JWT payload 'sub' = user_id
  return this.teamsService.getMyTeam(leaderId);
}
//remove team member
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEAM_LEADER')
@Post('remove-member')
removeMember(@Body() dto: AddMemberDto) {
  return this.teamsService.removeMember(dto);
}
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.teamsService.findOne(id);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEAM_LEADER')
@Get('my-team/members')
async getMyTeamMembers(@Req() req: any) {
  const leaderId = req.user.sub;
  return this.teamsService.findMembersByManager(leaderId);
}
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEAM_LEADER')
@Get('my-team/stats')
async getMyTeamStats(@Req() req: any) {
  const leaderId = req.user.sub;
  return this.teamsService.calculateTeamStats(leaderId);
}
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEAM_LEADER')
@Get('my-team/certifications')
async getMyTeamCertifications(@Req() req: any) {
  const leaderId = req.user.sub;
  return this.teamsService.findAllTeamCertifications(leaderId);
}
}
