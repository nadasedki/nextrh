import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from '../auth/dto/register.dto';
@Controller('users')
export class UsersController {constructor(private readonly usersService: UsersService) {}

  // List all users (Bid Manager only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BID_MANAGER')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
 @UseGuards(JwtAuthGuard, RolesGuard)
 @Roles('TEAM_LEADER')
 @Get('team')
 async getTeamMembers(@Req() req) {
   const team_leader_id = req.user.sub;
   return this.usersService.findTeamMembers(team_leader_id);
}
  // Get user by ID (Bid Manager or Team Leader of the same team)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER', 'BID_MANAGER')
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOneById(id);
  }

  // Create new user (BID_MANAGER only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BID_MANAGER')
  @Post()
  create(@Body() dto: RegisterDto) {
    return this.usersService.create(dto);
  }

  // Update user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEAM_LEADER', 'BID_MANAGER')
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // Delete user (soft delete or deactivate)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BID_MANAGER')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }



}
