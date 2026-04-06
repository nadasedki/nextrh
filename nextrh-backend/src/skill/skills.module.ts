import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsController } from './skills.controller'
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import { UserSkill } from './entities/user-skill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Skill, UserSkill]),
  ],
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService], // Exported so EmployeesService can use it
})
export class SkillsModule {}