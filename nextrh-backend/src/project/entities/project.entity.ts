import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Adjust path
import { Cv } from 'src/cvs/entities/cv.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number; // Matches p.id

  @Column()
  user_id: number;

  @Column()
  name: string; // Matches p.name

  @Column({ nullable: true })
  client: string; // Matches p.client

  @Column({ nullable: true })
  role: string; // Matches p.role

  @Column('text', { nullable: true })
  description: string; // Matches p.description

  @Column({ type: 'date', nullable: true })
  start_date: Date; // Used for p.startDate

  @Column({ type: 'date', nullable: true })
  end_date: Date; // Used for p.endDate

  @Column('text', { array: true, nullable: true })
  technologies: string[]; // Matches p.technologies

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @ManyToOne(() => Cv, (cv) => cv.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cvCvId' }) // Matches the column name in your DB
  cv: Cv;
}