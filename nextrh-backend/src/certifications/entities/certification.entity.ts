import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Cv } from 'src/cvs/entities/cv.entity';

@Entity('certifications')
export class Certification {
  // Map "cert_id" (DB) to "certId" (Code)
  @PrimaryGeneratedColumn({ name: 'cert_id' }) 
  certId: number;

  // Map "cert_name" (DB) to "certName" (Code)
  @Column({ name: 'cert_name' }) 
  certName: string;

  // Map "provider" (DB) -> "provider" (Code)
  @Column({ name: 'provider', nullable: true }) 
  provider: string;

  @Column({ name: 'issue_date', type: 'date', nullable: true }) 
  issueDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true }) 
  expiryDate: Date;

  @Column({ name: 'file_path', nullable: true }) 
  filePath: string;

  @Column({ name: 'status', default: 'active' }) 
  status: string;

  // NOTE: Your SQL Schema does NOT have a 'credential_id' column. 
  // If you need it, run: ALTER TABLE certifications ADD COLUMN credential_id varchar;
  @Column({ name: 'credential_id', nullable: true })
  credentialId: string; 

  // RELATIONSHIPS
  @ManyToOne(() => User, (user) => user.certifications)
  @JoinColumn({ name: 'user_id' }) // This prevents TypeORM from creating "userId" column
  user: User;

  // Explicit column for easy access
  @Column({ name: 'user_id' })
  userId: number;
    @ManyToOne(() => Cv, (cv) => cv.certifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cvCvId' }) // Matches the column name in your DB
  cv: Cv;
}