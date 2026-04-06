import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Adjust path
import { Cv } from 'src/cvs/entities/cv.entity'; // Adjust path

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  company: string;

  @Column()
  role: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date; // Null means "Present" (Depuis)

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
    @ManyToOne(() => Cv, (cv) => cv.experiences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cvCvId' }) // Matches the column name in your DB
  cv: Cv;
}