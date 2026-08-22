import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity'; 
import { Education } from 'src/education/entities/education.entity';
import { Project } from 'src/project/entities/project.entity';
import { Experience } from 'src/experience/entities/experience.entity';
import { Certification } from 'src/certifications/entities/certification.entity';

@Entity('cvs')
export class Cv {
  @PrimaryGeneratedColumn()
  cv_id: number;

  @Column()
  user_id: number;

  @Column()
  file_path: string;

  @Column({ nullable: true })
  format: string;

  @Column({ default: false })
  generated: boolean;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  last_updated: Date;
// --- Identity fields from CV ---
  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  profession: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  fax: string;

  @Column({ nullable: true })
  address: string;

@Column("simple-array", { nullable: true })
skills: string[];

  @Column({ name: 'active_generation', default: 1 })
  active_generation: number;
  
   @OneToMany(() => Education, (education) => education.cv, { cascade: true })
  educations: Education[];

  @OneToMany(() => Project, (project) => project.cv, { cascade: true })
  projects: Project[];

  @OneToMany(() => Experience, (experience) => experience.cv, { cascade: true })
  experiences: Experience[];

  @OneToMany(() => Certification, (certification) => certification.cv, { cascade: true })
  certifications: Certification[];
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}