import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Skill } from './skill.entity'; // You need to define this too

@Entity('user_skills')
export class UserSkill {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn()
  skill_id: number;

  @Column({ nullable: true })
  level: string; // e.g., 'Beginner', 'Intermediate', 'Expert'

  @ManyToOne(() => User, (user) => user.userSkills)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Skill, (skill) => skill.userSkills)
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;
}