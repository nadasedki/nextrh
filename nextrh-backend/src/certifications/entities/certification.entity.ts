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
  
  @PrimaryGeneratedColumn({ name: 'cert_id' }) 
  certId: number;

 
  @Column({ name: 'cert_name' }) 
  certName: string;

  
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

  
  @Column({ name: 'credential_id', nullable: true })
  credentialId: string; 

  // RELATIONSHIPS
  @ManyToOne(() => User, (user) => user.certifications)
  @JoinColumn({ name: 'user_id' }) 
  user: User;

  @Column({ name: 'user_id' })
  userId: number;
    @ManyToOne(() => Cv, (cv) => cv.certifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cvCvId' })
  cv: Cv;
}