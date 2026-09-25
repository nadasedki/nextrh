import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; 
import { Cv } from 'src/cvs/entities/cv.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number; 

  @Column()
  user_id: number;

  @Column()
  name: string; 

  @Column({ nullable: true })
  client: string; 



  @Column('text', { nullable: true })
  description: string; 

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date; 

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @ManyToOne(() => Cv, (cv) => cv.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cvCvId' }) 
  cv: Cv;
}