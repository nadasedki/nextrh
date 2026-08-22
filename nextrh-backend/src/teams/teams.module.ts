import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
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
  exports: [TypeOrmModule, TeamsService], 
})
export class TeamsModule {}
