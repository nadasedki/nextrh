// src/teams/teams.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../users/entities/team.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Team,User]),forwardRef(() => AuthModule), 
     forwardRef(() => UsersModule),],
  providers: [TeamsService],
  controllers: [TeamsController],
  exports: [TypeOrmModule, TeamsService], // export TypeOrmModule so UsersModule can inject TeamRepository
})
export class TeamsModule {}
