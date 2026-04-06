import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TeamsModule } from 'src/teams/teams.module'; 
import { AuthModule } from 'src/auth/auth.module';
@Module({
     imports: [TypeOrmModule.forFeature([User, Role]),
     forwardRef(() => TeamsModule),
    ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService,TypeOrmModule], // export to use in AuthService
})
export class UsersModule {}
