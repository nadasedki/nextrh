import { Controller, Post, Body, UseGuards, Req, Get, Patch,Request, ParseIntPipe, Param, Delete } from '@nestjs/common';
import { ProjectService } from './project.service'; // Adjust path
import { CreateProjectDto } from './dto/create-project.dto'; // Adjust path
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust path
import { RolesGuard } from '../auth/roles.guard'; // Adjust path
import { Roles } from '../auth/roles.decorator'; // Adjust path

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYEE')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectService) {}


  @Post()
  async createProject(@Req() req, @Body() createDto: CreateProjectDto) {
    const userId = req.user?.userId;
    return this.projectsService.create(userId, createDto);
  }

  @Get('me')
  async findMine(@Req() req) {
    const userId = req.user?.userId;
    console.log(' GET /projects/me - userId:', userId);
    return this.projectsService.findByUser(userId);
  }


  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateDto: any
  ) {
    const userId = req.user?.userId;
    return this.projectsService.update(id, userId, updateDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    const userId = req.user?.userId;
    return this.projectsService.remove(id, userId);
  }


}