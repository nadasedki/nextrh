import { AppService } from './app.service';

import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UpdateUserDto } from './users/dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}

