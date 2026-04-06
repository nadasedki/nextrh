import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { UserSkill } from './entities/user-skill.entity';
export declare class SkillsService {
    private skillRepository;
    private userSkillRepository;
    constructor(skillRepository: Repository<Skill>, userSkillRepository: Repository<UserSkill>);
    findAllSkills(): Promise<Skill[]>;
    addSkillToUser(userId: number, skillName: string, level: string): Promise<UserSkill>;
}
