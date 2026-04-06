import { User } from '../../users/entities/user.entity';
import { Skill } from './skill.entity';
export declare class UserSkill {
    user_id: number;
    skill_id: number;
    level: string;
    user: User;
    skill: Skill;
}
