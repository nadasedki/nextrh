import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { UserSkill } from './entities/user-skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private skillRepository: Repository<Skill>,
    @InjectRepository(UserSkill)
    private userSkillRepository: Repository<UserSkill>,
  ) {}

  async findAllSkills(): Promise<Skill[]> {
    return await this.skillRepository.find();
  }

  async addSkillToUser(userId: number, skillName: string, level: string) {
    // 1. Find or create the skill
    let skill = await this.skillRepository.findOne({ where: { skill_name: skillName } });
    if (!skill) {
      skill = this.skillRepository.create({ skill_name: skillName });
      await this.skillRepository.save(skill);
    }

    // 2. Link skill to user
    const userSkill = this.userSkillRepository.create({
      user_id: userId,
      skill_id: skill.skill_id,
      level,
    });

    return await this.userSkillRepository.save(userSkill);
  }
}