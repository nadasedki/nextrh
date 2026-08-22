import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TeamsModule } from 'src/teams/teams.module'; 
import { ExperienceModule } from 'src/experience/experience.module';
import { Experience } from 'src/experience/entities/experience.entity';
@Module({
     imports: [TypeOrmModule.forFeature([User, Role,Experience]),
     forwardRef(() => TeamsModule),
     ExperienceModule,
    ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService,TypeOrmModule],
})
export class UsersModule {}
