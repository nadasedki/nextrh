import { SkillsService } from './skills.service';
export declare class SkillsController {
    private readonly skillsService;
    constructor(skillsService: SkillsService);
    getAllSkills(): Promise<import("./entities/skill.entity").Skill[]>;
    addSkillToMe(req: any, skillName: string, level: string): Promise<import("./entities/user-skill.entity").UserSkill>;
}
