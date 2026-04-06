import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cv } from 'src/cvs/entities/cv.entity';
@Entity('education')
export class Education {
  @PrimaryGeneratedColumn()
  education_id: number;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  institution: string;

  @Column({ nullable: true })
  degree: string;

  @Column({ nullable: true })
  field_of_study: string;

  @Column({ nullable: true })
  start_year: number;

  @Column({ nullable: true })
  end_year: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;
  @ManyToOne(() => Cv, (cv) => cv.educations, {
    onDelete: 'CASCADE',
  })
  cv: Cv;
}