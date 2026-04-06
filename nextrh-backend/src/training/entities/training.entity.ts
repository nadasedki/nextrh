import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('training_sessions')
export class Training {
  @PrimaryGeneratedColumn()
  training_id: number;

  @Column()
  user_id: number;

  @Column()
  training_name: string;

  @Column()
  provider: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  completion_date?: string;

  @Column({ nullable: true })
  duration?: string;

  @ManyToOne(() => User, (user) => user.trainings)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
