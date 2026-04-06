import { Controller, Get, UseGuards, Query, Req, Param } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYEE','BID_MANAGER', 'TEAM_LEADER')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('me')
  async findMe(@Req() req) {
    // Extract userId from JWT
    const userId = req.user?.userId || req.user?.sub || req.user?.id || req.user?.user_id;
    console.log('🚨 GET /employees/me - userId:', userId);
    return this.employeesService.getDashboardData(userId);
  }
  @Get('me/cv')
  async getMyCvData(@Req() req) {
    const userId = req.user?.userId;
    console.log('🚨 GET /employees/me/cv - userId:', userId);
    return this.employeesService.getFullEmployeeCv(userId);
  }
  @Get()
  async getAllEmployees(
    @Query('search') searchQuery?: string,
  ) {
    if (searchQuery) {
      return this.employeesService.searchEmployees(searchQuery);
    }
    return this.employeesService.findAllEmployees();
  }
  @Get('stats/dashboard')
  async getDashboardStats() {
    return this.employeesService.calculateDashboardStats();
  }
  @Get(':id')
async getEmployeeById(@Param('id') id: number) {
  return this.employeesService.findOne(id);
}

}