import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserSkill } from './user-skill.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  skill_id: number;

  @Column({ unique: true })
  skill_name: string;

  @OneToMany(() => UserSkill, (userSkill) => userSkill.skill)
  userSkills: UserSkill[];
}