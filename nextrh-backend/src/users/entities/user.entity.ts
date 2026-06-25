import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Role } from './role.entity';
import { Team } from './team.entity';
import { Certification } from 'src/certifications/entities/certification.entity';
import { Project } from 'src/project/entities/project.entity';
import { Training } from 'src/training/entities/training.entity';
import { UserSkill } from 'src/skill/entities/user-skill.entity';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  full_name: string;

  @Column({ default: true })
  active: boolean;
@Column({ nullable: true })
  title: string;

@Column({ nullable: true })
  department: string;
  @Column({ default: 0 })
  years_of_experience: number;
  @Column({ type: 'text', nullable: true })
  summary: string;
  @OneToMany(() => UserSkill, (userSkill) => userSkill.user)
  userSkills: UserSkill[];

@Column({ default: 0 })
  score: number;
    
  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'user_id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'role_id' },
})
  roles: Role[];

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  updated_at: Date;
  @ManyToMany(() => Team, team => team.members)
  teams: Team[];
  @OneToMany(() => Certification, (cert) => cert.user)
  certifications: Certification[];

  @OneToMany(() => Training, (training) => training.user)
 trainings: Training[];

 @OneToMany(() => Project, (project) => project.user)
 projects: Project[];

}
